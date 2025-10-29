import { Module } from '@nestjs/common';
import { GuardrailsService } from './guardrails.service';
import { SexualContentValidator } from './validators/sexual-content-validator';
import { PromptInjectionValidator } from './validators/prompt-injection-validator';
import { BlacklistedWordsValidator } from './validators/blacklisted-words-validator';
import { MedicalAdviceValidator } from './validators/medical-advice-validator';
import { ExcessiveRepetitionValidator } from './validators/excessive-repetition-validator';
import { HtmlContentValidator } from './validators/html-content-validator';

@Module({
    providers: [
        GuardrailsService,
        SexualContentValidator,
        PromptInjectionValidator,
        BlacklistedWordsValidator,
        MedicalAdviceValidator,
        ExcessiveRepetitionValidator,
        HtmlContentValidator,
    ],
    exports: [
        GuardrailsService,
        SexualContentValidator,
        PromptInjectionValidator,
        BlacklistedWordsValidator,
        MedicalAdviceValidator,
        ExcessiveRepetitionValidator,
        HtmlContentValidator,
    ],
})
export class GuardrailsModule {}
