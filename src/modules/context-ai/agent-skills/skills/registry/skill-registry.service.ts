import { Injectable } from '@nestjs/common';
import { Skill } from '../core/interfaces';
import { ListDoctorsSkill, ListAppointmentsSkill, SkillEnum } from '../implementations';

@Injectable()
export class SkillRegistry {
    private readonly implementations: Map<SkillEnum, Skill> = new Map();

    constructor(
        private readonly listDoctorsSkill: ListDoctorsSkill,
        private readonly listAppointmentsSkill: ListAppointmentsSkill,
    ) {
        this.registerImplementation(SkillEnum.listDoctors, this.listDoctorsSkill);
        this.registerImplementation(SkillEnum.listAppointments, this.listAppointmentsSkill);
    }

    private registerImplementation(name: SkillEnum, implementation: Skill): void {
        this.implementations.set(name, implementation);
    }

    public getImplementations(names: SkillEnum[]): Skill[] {
        return names
            .map((name) => this.implementations.get(name))
            .filter((implementation) => implementation !== undefined) as Skill[];
    }
}
