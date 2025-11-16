import { type Timezone } from "@/types/schedule"

export const tz_dict: Map<Timezone,string> = new Map()
tz_dict.set('America/Los_Angeles','Pacific Time')
tz_dict.set('America/Phoenix','Arizona Time')
tz_dict.set('America/Denver','Mountain Time')
tz_dict.set('America/Chicago','Central Time')
tz_dict.set('America/New_York','Eastern Time')
tz_dict.set('Pacific/Honolulu','Hawaii Time')
tz_dict.set('America/Anchorage','Alaska Time')
tz_dict.set('America/Adak','Aleutian Time')
tz_dict.set('America/Puerto_Rico','Puerto Rico/Virgin Islands Time')
tz_dict.set('Pacific/Guam','Guam/Mariana Time')
tz_dict.set('Pacific/Samoa','American Samoa Time')
