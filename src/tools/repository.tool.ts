import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { WeblateApiService } from '../services';

const scopeSchema = {
  projectSlug: z.string().describe('The slug of the project'),
  componentSlug: z
    .string()
    .optional()
    .describe(
      'Optional component slug. If omitted, the operation runs at project level (all components). If provided, it runs for that component only.',
    ),
};

@Injectable()
export class WeblateRepositoryTool {
  private readonly logger = new Logger(WeblateRepositoryTool.name);

  constructor(private weblateApiService: WeblateApiService) {}

  @Tool({
    name: 'getRepositoryStatus',
    description:
      'Check VCS repository status behind Weblate (pending commit/merge/push). Use before commit/push to see if there is anything to do. Omit componentSlug for project-wide status.',
    parameters: z.object(scopeSchema),
  })
  async getRepositoryStatus({
    projectSlug,
    componentSlug,
  }: {
    projectSlug: string;
    componentSlug?: string;
  }) {
    try {
      const status = await this.weblateApiService.getRepositoryStatus(
        projectSlug,
        componentSlug,
      );
      const scope = componentSlug
        ? `${projectSlug}/${componentSlug}`
        : projectSlug;

      return {
        content: [
          {
            type: 'text',
            text: `Repository status for "${scope}":\n\n- needs_commit: ${status.needs_commit}\n- needs_merge: ${status.needs_merge}\n- needs_push: ${status.needs_push}${status.status ? `\n- status: ${status.status}` : ''}${status.remote_commit ? `\n- remote_commit: ${status.remote_commit}` : ''}${status.merge_failure ? `\n- merge_failure: ${status.merge_failure}` : ''}\n\nFull status:\n\`\`\`json\n${JSON.stringify(status, null, 2)}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get repository status', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting repository status: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  @Tool({
    name: 'commitRepository',
    description:
      'Commit all pending changes in Weblate to its local VCS repository. Omit componentSlug to commit the whole project, provide it to commit a single component.',
    parameters: z.object(scopeSchema),
  })
  async commitRepository({
    projectSlug,
    componentSlug,
  }: {
    projectSlug: string;
    componentSlug?: string;
  }) {
    try {
      const result = await this.weblateApiService.commitRepository(
        projectSlug,
        componentSlug,
      );
      const scope = componentSlug
        ? `${projectSlug}/${componentSlug}`
        : projectSlug;

      return {
        content: [
          {
            type: 'text',
            text: `Commit triggered for "${scope}". Result:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to commit repository', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error committing repository: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  @Tool({
    name: 'pushRepository',
    description:
      'Push committed changes from Weblate upstream to the remote VCS (e.g. GitHub). Commit first if getRepositoryStatus shows needs_commit. Omit componentSlug to push the whole project.',
    parameters: z.object(scopeSchema),
  })
  async pushRepository({
    projectSlug,
    componentSlug,
  }: {
    projectSlug: string;
    componentSlug?: string;
  }) {
    try {
      const result = await this.weblateApiService.pushRepository(
        projectSlug,
        componentSlug,
      );
      const scope = componentSlug
        ? `${projectSlug}/${componentSlug}`
        : projectSlug;

      return {
        content: [
          {
            type: 'text',
            text: `Push triggered for "${scope}". Result:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to push repository', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error pushing repository: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  @Tool({
    name: 'commitAndPushRepository',
    description:
      'Commit pending changes and immediately push them upstream. Convenience wrapper for the typical "flush Weblate changes to git" workflow. Omit componentSlug for project-wide operation.',
    parameters: z.object(scopeSchema),
  })
  async commitAndPushRepository({
    projectSlug,
    componentSlug,
  }: {
    projectSlug: string;
    componentSlug?: string;
  }) {
    try {
      const commitResult = await this.weblateApiService.commitRepository(
        projectSlug,
        componentSlug,
      );
      const pushResult = await this.weblateApiService.pushRepository(
        projectSlug,
        componentSlug,
      );
      const scope = componentSlug
        ? `${projectSlug}/${componentSlug}`
        : projectSlug;

      return {
        content: [
          {
            type: 'text',
            text: `Commit + push completed for "${scope}".\n\nCommit result:\n\`\`\`json\n${JSON.stringify(commitResult, null, 2)}\n\`\`\`\n\nPush result:\n\`\`\`json\n${JSON.stringify(pushResult, null, 2)}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to commit and push repository', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error during commit+push: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
}
