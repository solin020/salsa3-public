from dataclasses import dataclass
from typing import Literal, Optional

@dataclass
class Recording():
    type: Literal['recording']
    id: str
    autoadvance: bool
    duration: Optional[float]

@dataclass
class MultipleChoiceCheckbox():
    type: Literal['multiple-choice-checkbox']
    label: str
    id: str
    options: list[str]

@dataclass
class SingleChoiceRadio():
    type: Literal['single-choice-radio']
    label: str
    id: str
    options: list[str]

@dataclass
class SingleChoiceDropdown():
    type: Literal['single-choice-dropdown']
    label: str
    id: str
    options: list[str]

@dataclass
class Slider():
    type: Literal['slider']
    label: str
    id: str
    min: float
    max: float

@dataclass
class Textbox():
    type: Literal['textbox']
    label: str
    id: str


@dataclass
class Ema():
    type: Literal['ema']
    id: str
    form: list[(Textbox|Slider|SingleChoiceDropdown|SingleChoiceRadio|MultipleChoiceCheckbox)]


@dataclass
class Image():
    type: Literal['image']
    id: str
    uri: str
    autoadvance: bool
    duration: Optional[float]


@dataclass
class Audio():
    type: Literal['audio']
    id: str
    uri: str
    autoadvance: bool
    duration: Optional[float]

@dataclass
class Video():
    type: Literal['video']
    id: str
    uri: str
    autoadvance: bool
    duration: Optional[float]



TestPrototypeMetadata = list[(Video|Audio|Image|Ema|Recording)]
