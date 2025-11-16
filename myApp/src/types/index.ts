export type Audio = {
    type: 'audio'
    id: string
    uri: string
    autoadvance?: boolean
    autoplay?:boolean
    hide_early?:boolean
    hide_controls?:boolean
    duration? : number
    file:File[]
}
export type QuestionType = (Textbox | Slider | SingleChoiceDropdown | SingleChoiceRadio | MultipleChoiceCheckbox)
export type Ema = {
    type: 'ema'
    id: string
    form: QuestionType[]
}

export type Image = {
    type: 'image'
    id: string
    uri: string
    autoadvance? :boolean
    hide_early? :boolean
    duration?: number
    file:File[]
}
export type MultipleChoiceCheckbox = {
    type: 'multiple-choice-checkbox'
    label: string
    id: string
    options: Array<string>
}
export type PictureCapture = {
    type: 'picture-capture'
    id: string
}
export type Recording = {
    type: 'recording'
    id: string
    autoadvance?: boolean
    autoplay?: boolean
    hide_early?: boolean
    hide_controls?: boolean
    duration?: number
    max_duration?: number
    message?:string
}

export type SingleChoiceDropdown = {
    type: 'single-choice-dropdown'
    label: string
    id: string
    options: Array<string>
}
export type SingleChoiceRadio = {
    type: 'single-choice-radio'
    label: string
    id: string
    options: Array<string>
}
export type Slider = {
    type: 'slider'
    label: string
    id: string
    min: number
    max: number
}
export type Breakpoint = {
    type: 'breakpoint'
    id: string
}


export type Stimulus = (Ema|Audio|Video|Image|Recording|VideoRecording|PictureCapture|Breakpoint)
export type TestPrototype = {
    id: string
    stimuli: Stimulus[]
    groups: string[]
    randomized: boolean
}
export type TestPrototypeMeta = {
    id: string
    groups: string[]
    response_stimuli: string[]
    randomized: boolean
}

export type Textbox = {
    type: 'textbox'
    label: string
    id: string
}

export type Video = {
    type: 'video'
    id: string
    uri: string
    autoadvance?: boolean
    autoplay?:boolean
    hide_early?:boolean
    hide_controls?:boolean
    duration?: number
    file:File[]
}

export type VideoRecording = {
    type: 'video-recording'
    id: string
    autoadvance: boolean
    duration: (number | null)
}

export type TwilioInfo = {
    project:string
    account_sid:string
    auth_token:string
    phone_number:string
    nickname:string
}

