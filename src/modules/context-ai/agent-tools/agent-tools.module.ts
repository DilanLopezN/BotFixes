import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ToolRegistry } from './registry/tool-registry.service';
import { AgentSkillsModule } from '../agent-skills/agent-skills.module';
import { IntentDetectionModule } from '../intent-detection/intent-detection.module';

@Module({
    imports: [HttpModule, AgentSkillsModule, IntentDetectionModule],
    providers: [ToolRegistry],
    exports: [ToolRegistry],
})
export class AgentToolsModule {}
