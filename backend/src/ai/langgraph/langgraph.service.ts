import { Logger, Injectable } from '@nestjs/common'

/**
 * Service for executing LangGraph workflows.
 *
 * This service acts as a facade to trigger specific workflows (e.g., Generate Abstract).
 * It abstracts the complexity of workflow initialization and execution from the rest of the application.
 */
@Injectable()
export class LanggraphService {
  private readonly logger = new Logger(LanggraphService.name)

  constructor() {}
}
