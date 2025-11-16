/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Annotator } from '../models/Annotator';
import type { ApiMessageSchedule } from '../models/ApiMessageSchedule';
import type { Body_device_upload_response_file_salsa_device_api_upload_response_file_post } from '../models/Body_device_upload_response_file_salsa_device_api_upload_response_file_post';
import type { Coordinator } from '../models/Coordinator';
import type { Participant } from '../models/Participant';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Device Upload Response File
     * @param scheduleId
     * @param testPrototypeId
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deviceUploadResponseFileSalsaDeviceApiUploadResponseFilePost(
        scheduleId: string,
        testPrototypeId: string,
        formData: Body_device_upload_response_file_salsa_device_api_upload_response_file_post,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/device/api/upload-response-file',
            query: {
                'schedule_id': scheduleId,
                'test_prototype_id': testPrototypeId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Coordinator Upload Response File
     * @param subjectId
     * @param scheduleId
     * @param testPrototypeId
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    
    /**
     * Test Get Client
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testGetClientSalsaDeviceClientClientHtmlGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/device/client/client.html',
        });
    }
    /**
     * Test Get Openpgp
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testGetOpenpgpSalsaDeviceClientOpenpgpJsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/device/client/openpgp.js',
        });
    }
    /**
     * Get Your Email
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getYourEmailSalsaServerApiGetYourEmailGet(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/get-your-email',
        });
    }
    /**
     * Get Admins
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getAdminsSalsaServerApiGetAdminsGet(): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/get-admins',
        });
    }
    /**
     * Add Admin
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addAdminSalsaServerApiAddAdminPost(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/add-admin',
            query: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Admin
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteAdminSalsaServerApiDeleteAdminPost(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/delete-admin',
            query: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Coordinators
     * @returns Coordinator Successful Response
     * @throws ApiError
     */
    public static getCoordinatorsSalsaServerApiGetCoordinatorsGet(): CancelablePromise<Array<Coordinator>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/get-coordinators',
        });
    }
    /**
     * Add Coordinator
     * @param id
     * @param project
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addCoordinatorSalsaServerApiAddCoordinatorPost(
        id: string,
        project: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/add-coordinator',
            query: {
                'id': id,
                'project': project,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Coordinator
     * @param id
     * @param project
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteCoordinatorSalsaServerApiDeleteCoordinatorPost(
        id: string,
        project: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/delete-coordinator',
            query: {
                'id': id,
                'project': project,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Annotators Admin
     * @returns Annotator Successful Response
     * @throws ApiError
     */
    public static getAnnotatorsAdminSalsaServerApiGetAnnotatorsAdminGet(): CancelablePromise<Array<Annotator>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/get-annotators-admin',
        });
    }
    /**
     * Get Annotators
     * @param project
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getAnnotatorsSalsaServerApiGetAnnotatorsGet(
        project: string,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/get-annotators',
            query: {
                'project': project,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Annotator
     * @param id
     * @param project
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addAnnotatorSalsaServerApiAddAnnotatorPost(
        id: string,
        project: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/add-annotator',
            query: {
                'id': id,
                'project': project,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Annotator
     * @param id
     * @param project
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteAnnotatorSalsaServerApiDeleteAnnotatorPost(
        id: string,
        project: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/delete-annotator',
            query: {
                'id': id,
                'project': project,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Participant
     * @param id
     * @param project
     * @param phoneNumber
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addParticipantSalsaServerApiAddParticipantPost(
        id: string,
        project: string,
        phoneNumber: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/add-participant',
            query: {
                'id': id,
                'project': project,
                'phone_number': phoneNumber,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Participant
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteParticipantSalsaServerApiDeleteParticipantPost(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/delete-participant',
            query: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Participants Admin
     * @returns Participant Successful Response
     * @throws ApiError
     */
    public static getParticipantsAdminSalsaServerApiGetParticipantsAdminGet(): CancelablePromise<Array<Participant>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/get-participants-admin',
        });
    }
    /**
     * Get Participant
     * @param project
     * @returns Participant Successful Response
     * @throws ApiError
     */
    public static getParticipantSalsaServerApiGetParticipantsGet(
        project: string,
    ): CancelablePromise<Array<Participant>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/get-participants',
            query: {
                'project': project,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Coordinator Get Projects
     * @returns string Successful Response
     * @throws ApiError
     */
    public static coordinatorGetProjectsSalsaServerApiCoordinatorGetProjectsGet(): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/coordinator-get-projects',
        });
    }
    /**
     * Admin Get Projects
     * @returns string Successful Response
     * @throws ApiError
     */
    public static adminGetProjectsSalsaServerApiAdminGetProjectsGet(): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/admin-get-projects',
        });
    }
    /**
     * Annotator Get Projects
     * @returns string Successful Response
     * @throws ApiError
     */
    public static annotatorGetProjectsSalsaServerApiAnnotatorGetProjectsGet(): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/api/annotator-get-projects',
        });
    }
    /**
     * Coordinator Schedule Messages
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static coordinatorScheduleMessagesSalsaServerApiScheduleMessagesPost(
        requestBody: ApiMessageSchedule,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/schedule-messages',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Coordinator Delete Messages
     * @param participantStudyId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static coordinatorDeleteMessagesSalsaServerApiDeleteMessagesPost(
        participantStudyId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/delete-messages',
            query: {
                'participant_study_id': participantStudyId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Coordinator Delete Message
     * @param scheduleId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static coordinatorDeleteMessageSalsaServerApiDeleteMessagePost(
        scheduleId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/delete-message',
            query: {
                'schedule_id': scheduleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Coordinator Get Messages
     * @param participantId
     * @returns any[] Successful Response
     * @throws ApiError
     */
    public static coordinatorGetMessagesSalsaServerApiGetMessagesAndResponsesPost(
        participantId: string,
    ): CancelablePromise<any[]> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/api/get-messages-and-responses',
            query: {
                'participant_id': participantId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Message Response Files
     * @param scheduleId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getMessageResponseFilesSalsaServerGetMessageResponseFilesGet(
        scheduleId: string,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/get-message-response-files',
            query: {
                'schedule_id': scheduleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Message Response File
     * @param scheduleId
     * @param filepath
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getMessageResponseFileSalsaServerGetMessageResponseFileGet(
        scheduleId: string,
        filepath: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/get-message-response-file',
            query: {
                'schedule_id': scheduleId,
                'filepath': filepath,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Message Response Transcriptions
     * @param scheduleId
     * @returns Transcription Successful Response
     * @throws ApiError
     */
    
    /**
     * Device Get Test Prototype
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deviceGetTestPrototypeSalsaDeviceGetTestPrototypeGet(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/device/get-test-prototype',
            query: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Coordinator Get Test Prototypes
     * @param project
     * @returns string Successful Response
     * @throws ApiError
     */
    public static coordinatorGetTestPrototypesSalsaServerGetTestPrototypesGet(
        project: string,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/get-test-prototypes',
            query: {
                'project': project,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Test Prototype Files
     * @param id
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getTestPrototypeFilesSalsaServerGetTestPrototypeFilesGet(
        id: string,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/get-test-prototype-files',
            query: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Test Prototype File
     * @param id
     * @param filepath
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getTestPrototypeFileSalsaServerGetTestPrototypeFileGet(
        id: string,
        filepath: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/get-test-prototype-file',
            query: {
                'id': id,
                'filepath': filepath,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Test Prototype
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addTestPrototypeSalsaServerAddTestPrototypePost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/salsa/server/add-test-prototype',
        });
    }
    /**
     * Read Public Key
     * @returns any Successful Response
     * @throws ApiError
     */
    public static readPublicKeySalsaServerPublicPgpGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/public.pgp',
        });
    }
    /**
     * Read Coordinator
     * @returns any Successful Response
     * @throws ApiError
     */
    public static readCoordinatorSalsaServerCoordinatorHtmlGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/coordinator.html',
        });
    }
    /**
     * Read Annotator
     * @returns any Successful Response
     * @throws ApiError
     */
    public static readAnnotatorSalsaServerAnnotatorHtmlGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/annotator.html',
        });
    }
    /**
     * Read Admin
     * @returns any Successful Response
     * @throws ApiError
     */
    public static readAdminSalsaServerAdminHtmlGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/salsa/server/admin.html',
        });
    }
}
