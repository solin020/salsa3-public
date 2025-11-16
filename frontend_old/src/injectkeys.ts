import {type InjectionKey, type Ref} from 'vue'
import {type Participant as ParticipantType, 
        type MessageSchedule,
        type MessageResponse as MessageResponseType,
} from '@/client'
import { type TestPrototypeMeta, type TwilioInfo } from './types'
import type {  SchedulePrototype, ResponseStimulus } from './types/schedule'

export const participant_list_key = Symbol() as InjectionKey<Ref<ParticipantType[]>>
export const participant_key = Symbol() as InjectionKey<ParticipantType>
export const message_response_list_key = Symbol() as InjectionKey<Ref<MessageResponseType[]>>
export const message_response_key = Symbol() as InjectionKey<MessageResponseType>
export const scheduled_message_list_key = Symbol() as InjectionKey<Ref<MessageSchedule[]>>
export const scheduled_message_key = Symbol() as InjectionKey<MessageSchedule>
export const reload_participants_key = Symbol() as InjectionKey<Function>
export const reload_messages_key = Symbol() as InjectionKey<Function>
export const project_key = Symbol() as InjectionKey<string>
export const test_prototypes_key = Symbol() as InjectionKey<Ref<TestPrototypeMeta[]>>
export const reload_test_prototypes_key = Symbol() as InjectionKey<Function>
export const groups_key = Symbol() as InjectionKey<Ref<string[]>>
export const reload_groups_key = Symbol() as InjectionKey<Function>
export const twilio_key = Symbol() as InjectionKey<Ref<TwilioInfo[]>>
export const reload_twilio_key = Symbol() as InjectionKey<Function>
export const schedule_prototype_list_key = Symbol() as InjectionKey<Ref<SchedulePrototype<'database'>[]>>
export const current_schedule_prototype_key = Symbol() as InjectionKey<Ref<SchedulePrototype<'database'>>>
export const reload_schedule_prototypes_key = Symbol() as InjectionKey<Function>
export const coordinator_id_key = Symbol() as InjectionKey<string>
export const sim_test_prototype_id_key = Symbol() as InjectionKey<string>
export const pinia_key = Symbol() as InjectionKey<any>
export const response_stimuli_key = Symbol() as InjectionKey<Ref<Map<string, ResponseStimulus>>>
export const close_all_key = Symbol() as InjectionKey<Ref<boolean>>
export const phase_ids_key = Symbol() as InjectionKey<Ref<string[]>>


