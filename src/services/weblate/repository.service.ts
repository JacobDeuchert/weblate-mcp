import { Injectable, Logger } from '@nestjs/common';
import { WeblateClientService } from '../weblate-client.service';
import {
  componentsRepositoryCreate,
  componentsRepositoryRetrieve,
  projectsRepositoryCreate,
  projectsRepositoryRetrieve,
  type OperationEnum,
} from '../../client';

export type RepositoryOperation = OperationEnum;

export interface RepositoryStatus {
  needs_commit: boolean;
  needs_merge: boolean;
  needs_push: boolean;
  merge_failure?: string | null;
  remote_commit?: string;
  status?: string;
  merge_error?: string | null;
  [key: string]: unknown;
}

export interface RepositoryOperationResult {
  result: boolean;
  [key: string]: unknown;
}

@Injectable()
export class WeblateRepositoryService {
  private readonly logger = new Logger(WeblateRepositoryService.name);

  constructor(private weblateClientService: WeblateClientService) {}

  async getProjectRepositoryStatus(
    projectSlug: string,
  ): Promise<RepositoryStatus> {
    try {
      const client = this.weblateClientService.getClient();
      const response = await projectsRepositoryRetrieve({
        client,
        path: { slug: projectSlug },
      });

      if (response.error) {
        throw new Error(`API error: ${JSON.stringify(response.error)}`);
      }

      return response.data as unknown as RepositoryStatus;
    } catch (error) {
      this.logger.error(
        `Failed to get repository status for project ${projectSlug}`,
        error,
      );
      throw new Error(
        `Failed to get repository status for project ${projectSlug}: ${error.message}`,
      );
    }
  }

  async getComponentRepositoryStatus(
    projectSlug: string,
    componentSlug: string,
  ): Promise<RepositoryStatus> {
    try {
      const client = this.weblateClientService.getClient();
      const response = await componentsRepositoryRetrieve({
        client,
        path: { project__slug: projectSlug, slug: componentSlug },
      });

      if (response.error) {
        throw new Error(`API error: ${JSON.stringify(response.error)}`);
      }

      return response.data as unknown as RepositoryStatus;
    } catch (error) {
      this.logger.error(
        `Failed to get repository status for ${projectSlug}/${componentSlug}`,
        error,
      );
      throw new Error(
        `Failed to get repository status for ${projectSlug}/${componentSlug}: ${error.message}`,
      );
    }
  }

  async projectRepositoryOperation(
    projectSlug: string,
    operation: RepositoryOperation,
  ): Promise<RepositoryOperationResult> {
    try {
      const client = this.weblateClientService.getClient();
      const response = await projectsRepositoryCreate({
        client,
        path: { slug: projectSlug },
        body: { operation },
      });

      if (response.error) {
        throw new Error(`API error: ${JSON.stringify(response.error)}`);
      }

      return response.data as unknown as RepositoryOperationResult;
    } catch (error) {
      this.logger.error(
        `Failed to perform repository operation "${operation}" on project ${projectSlug}`,
        error,
      );
      throw new Error(
        `Failed to perform repository operation "${operation}" on project ${projectSlug}: ${error.message}`,
      );
    }
  }

  async componentRepositoryOperation(
    projectSlug: string,
    componentSlug: string,
    operation: RepositoryOperation,
  ): Promise<RepositoryOperationResult> {
    try {
      const client = this.weblateClientService.getClient();
      const response = await componentsRepositoryCreate({
        client,
        path: { project__slug: projectSlug, slug: componentSlug },
        body: { operation },
      });

      if (response.error) {
        throw new Error(`API error: ${JSON.stringify(response.error)}`);
      }

      return response.data as unknown as RepositoryOperationResult;
    } catch (error) {
      this.logger.error(
        `Failed to perform repository operation "${operation}" on ${projectSlug}/${componentSlug}`,
        error,
      );
      throw new Error(
        `Failed to perform repository operation "${operation}" on ${projectSlug}/${componentSlug}: ${error.message}`,
      );
    }
  }

  async commitProject(projectSlug: string): Promise<RepositoryOperationResult> {
    return this.projectRepositoryOperation(projectSlug, 'commit');
  }

  async pushProject(projectSlug: string): Promise<RepositoryOperationResult> {
    return this.projectRepositoryOperation(projectSlug, 'push');
  }

  async commitComponent(
    projectSlug: string,
    componentSlug: string,
  ): Promise<RepositoryOperationResult> {
    return this.componentRepositoryOperation(
      projectSlug,
      componentSlug,
      'commit',
    );
  }

  async pushComponent(
    projectSlug: string,
    componentSlug: string,
  ): Promise<RepositoryOperationResult> {
    return this.componentRepositoryOperation(projectSlug, componentSlug, 'push');
  }
}
