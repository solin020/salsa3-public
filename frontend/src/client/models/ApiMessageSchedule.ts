/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Participant } from './Participant';
export type ApiMessageSchedule = {
    project: string;
    participant: Participant;
    start_date: string;
    end_date: string;
    times: Array<any[]>;
    prototype_id: string;
};

