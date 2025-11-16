import {defineStore} from 'pinia'
import {ref, type Ref, computed} from 'vue'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import type {SchedulePrototype} from './types/schedule'
import type { TestPrototype } from './types'
import JSZip from 'jszip'
import write_file from './write_file'






function get_mime_type(name:string):string{
  if (name.endsWith('.txt') || name.endsWith('.json')){
    return 'text/plain'
  } else if (name.endsWith('.jpg') || name.endsWith('.jpeg')){
    return 'image/jpeg'
  } else if (name.endsWith('.png')){
    return 'image/png'
  } else if (name.endsWith('.wav')){
    return 'audio/wav'
  } else if (name.endsWith('.mp4')){
    return 'video/mp4'
  } else{
    return 'application/octet-stream'
  }
}

interface UploadType{
  name:string
  date:Date
}

export const salsaStore = defineStore('salsa', () =>{
    const salsaid = ref('')
    const old_salsaid = ref('')
    const salsa_domain = ref('')
    const old_salsadomain = ref('')
    const public_key = ref('')
    const downloads: Ref<string[]> = ref([])
    const downloads_total = ref(0)
    const downloads_remaining = computed(()=>downloads.value.length)
    const current_component = ref('Login')
    const getting_schedule = ref(false)
    const downloading = ref(false)
    const unzipping = ref(false)
    const zips_total = ref(0)
    const zips_remaining = ref(0)
    const randomization_order: Ref<number[]> = ref([])
    const first_ping_status = ref(200)
    const current_test_prototype: Ref<(SchedulePrototype<"device">["phases"][number]["spec"]["tests"][number])|null> = ref(null)
    const taking_scheduled = ref(false)
    const downloading_message = computed(()=>
      `Downloaded ${downloads_total.value - downloads_remaining.value}/${downloads_total.value} tests`
    )
    const unzipping_message = computed(()=>
      `Unzipped ${zips_total.value - zips_remaining.value}/${zips_total.value} files`
    )
    const zip_percent = computed(()=>{
      1- (zips_remaining.value / zips_total.value)
    })
    const download_percent = computed(()=>{
      1 - (downloads_remaining.value / downloads_total.value)
    })
    async function initial_salsaid(){
      try{
        const salsaid_data = await Filesystem.readFile({
            path: 'salsaid.txt',
            directory: Directory.External,
            encoding: Encoding.UTF8
        })
        salsaid.value = salsaid_data.data.toString()
        const salsa_domain_data = await Filesystem.readFile({
          path: 'salsa_domain.txt',
          directory: Directory.External,
          encoding: Encoding.UTF8
        })
        salsa_domain.value = salsa_domain_data.data.toString()
      } catch{}

    }
    initial_salsaid()
    const schedule: Ref<SchedulePrototype<'device'>|null> = ref(null)
    async function initial_schedule(){
      try{
        schedule.value = JSON.parse(
        (await Filesystem.readFile({
          path:'schedule.json',
          directory:Directory.External,
          encoding: Encoding.UTF8
        })).data.toString()
        )
        public_key.value = (await Filesystem.readFile({
          path:'public_key.txt',
          directory:Directory.External,
          encoding: Encoding.UTF8
        })).data.toString()
      } catch {}
      if (schedule.value){
        current_component.value='HomePage'
      } else{
        current_component.value='Login'
      }
    }
    initial_schedule()

    async function write_schedule(){
      await Filesystem.writeFile({
        path: 'schedule.json',
        data: JSON.stringify(schedule.value),
        directory: Directory.External,
        encoding: Encoding.UTF8
      })
      await Filesystem.writeFile({
        path: 'public_key.txt',
        data: public_key.value,
        directory: Directory.External,
        encoding: Encoding.UTF8
      })
    }
    async function get_schedule(id:string){
        getting_schedule.value = true
        const first_ping = await fetch(`https://${salsa_domain.value}/salsa/device/get-schedule?response_code=${salsaid.value}`)
        first_ping_status.value = first_ping.status
        const my_schedule: SchedulePrototype<'device'> = await (
          first_ping
        ).json()
        public_key.value = await (
          await fetch(`https://${salsa_domain.value}/salsa/device/get-public-key?response_code=${salsaid.value}`)
        ).text()
        schedule.value = my_schedule
        getting_schedule.value = false
        await (Filesystem.mkdir({
          path:'testprototypes',
          directory:Directory.External, 
          recursive:true
        }).catch(()=>{}))
        
        await (Filesystem.mkdir({
          path:'awaiting-upload',
          directory:Directory.External, 
          recursive:true
        }).catch(()=>{}))

        await (Filesystem.mkdir({
          path:'finished-upload',
          directory:Directory.External, 
          recursive:true
        }).catch(()=>{}))
        downloading.value = true
        const awaiting_downloads_arr:string[] = []
        if(my_schedule.default_selection){
          const ds = my_schedule.default_selection
          if (ds.type==='fixed'){
            awaiting_downloads_arr.push(ds.test_prototype_id)
          } else if (ds.type==='random'){
            awaiting_downloads_arr.push(...ds.test_prototype_ids)
          } else if (ds.type==='choose'){
            awaiting_downloads_arr.push(...ds.test_prototype_ids)
          }
        }
        for (const phase of my_schedule.phases){
          for (const test of phase.spec.tests){
            awaiting_downloads_arr.push(test.prototype_selection.test_prototype_id)
          }
        }
        const awaiting_downloads = new Set(awaiting_downloads_arr)
        downloads.value = [...awaiting_downloads]
        downloads_total.value = awaiting_downloads.size
        for (const ts of awaiting_downloads){
          await save_test_prototype(ts)
          downloads.value.splice(downloads.value.indexOf(ts), 1)
        }
        await write_schedule()
        downloading.value = false
        downloads.value = []
      }

    async function set_salsaid(id:string, domain:string){
        salsaid.value = id
        salsa_domain.value = domain
        await Filesystem.writeFile({
          path: 'salsaid.txt',
          data: id,
          directory: Directory.External,
          encoding: Encoding.UTF8
        })
        await Filesystem.writeFile({
          path: 'salsa_domain.txt',
          data: domain,
          directory: Directory.External,
          encoding: Encoding.UTF8
        })
        await get_schedule(id)
    }
    async function reset_salsaid(){
      salsaid.value = old_salsaid.value
      salsa_domain.value = old_salsadomain.value
      await Filesystem.writeFile({
        path: 'salsaid.txt',
        data: salsaid.value,
        directory: Directory.External,
        encoding: Encoding.UTF8
      })
      await Filesystem.writeFile({
        path: 'salsa_domain.txt',
        data: salsa_domain.value,
        directory: Directory.External,
        encoding: Encoding.UTF8
      })
    }
    async function save_test_prototype(id:string){
        console.log('got to save test prototype')
        const resp = await fetch(`https://${salsa_domain.value}/salsa/device/get-test-prototype?response_code=${salsaid.value}&id=${id}`)
        const zip =  await resp.blob()
        unzipping.value = true
        const zipContent = await JSZip.loadAsync(zip)
        zips_total.value = Object.entries(zipContent.files).length
        zips_remaining.value = zips_total.value
        zipContent.forEach(async (relativePath: string, zipFile: JSZip.JSZipObject) => {
            if(zipFile.dir){
              zips_remaining.value -= 1
              // don't write directories the zip files downloaded are supposed to be flat
            } else{
              const bdata = await zipFile.async('blob')
              await write_file({
                  path: `testprototypes/${id}/${zipFile.name.split('/').pop()}`,
                  f: new File([bdata], zipFile.name, {type:get_mime_type(zipFile.name)})
              })
              zips_remaining.value -= 1
              if (zips_remaining.value<=0){
                unzipping.value = false
                if (downloads_remaining.value<=0){
                  current_component.value='HomePage'
                }
              }
            }
          }
        )
      
      }
    const sequence_no = ref(-1)
    const schedule_id = ref('')
    const test_prototype_id = ref('')
    const todays_test_prototype:Ref<TestPrototype|null> = ref(null)

    const uploading_flag = ref(false)
    const uploads: Ref<UploadType[]> = ref([])
    const uploads_total = ref(0)
    const initial_message = computed(()=>`${uploads_total.value} files waiting to be uploaded` )
    const uploads_remaining = computed(()=>uploads.value.length)
    const progress = computed(()=>(uploads_total.value-uploads_remaining.value)/uploads_total.value)
    const upload_message = computed(()=>`${(uploads_total.value-uploads_remaining.value)}/${uploads_total.value}`)

    async function update_uploads(){
      const pushval: UploadType[] = []
      for (const {name} of (await Filesystem.readdir({
          directory:Directory.External, path:'awaiting-upload'
      })).files){
          const [ , , , , timestamp, true_name] = name.split('|')
          pushval.push({
              name:true_name.split('.')[0],
              date: new Date(timestamp)
          })
      }
      uploads.value = pushval
    }
    async function upload(){
      uploading_flag.value = true
      await update_uploads()
      uploads_total.value = uploads.value.length
      for (const {name} of (await Filesystem.readdir({
          directory:Directory.External, path:'awaiting-upload'
      })).files){
          const [schedule_id, response_code, test_prototype_id, sequence_no, timestamp, true_name] = name.split('|')
          const armor_string = (await Filesystem.readFile({
                  directory:Directory.External,
                  path: `awaiting-upload/${name}`,
                  encoding: Encoding.UTF8
              })).data as string
          const armor_blob = new Blob([armor_string], {type:'text/plain'})
          const fd = new FormData()
          fd.append(`${true_name}`, armor_blob, `${true_name}`)
          try{
            const response = await fetch(`https://${salsa_domain.value}/salsa/device/api/upload-response-file?` + 
                new URLSearchParams({
                    response_code,
                    schedule_id, 
                    test_prototype_id,
                    timestamp,
                    sequence_no
                }), {
                    body:fd,
                    method:'POST',
                    signal: AbortSignal.timeout(60000)
                }
            )
            if (response.status===200){
                Filesystem.rename({
                    from: `awaiting-upload/${name}`,
                    to: `finished-upload/${name}`,
                    directory: Directory.External,
                    toDirectory: Directory.External
                })
            } else {
              alert(`Couldn't connect to server to upload your test files. Please try again later.`)
              uploading_flag.value=false
              return
            }
            await update_uploads()
          } catch {
            alert(`Couldn't connect to server to upload your test files. Please try again later.`)
            uploading_flag.value=false
            return
          }
      }
      uploading_flag.value=false
      if (schedule.value){
        current_component.value = 'HomePage'
      } else{
        current_component.value = 'Login'
      }
    }


    return {schedule, salsaid, set_salsaid, downloads,
      sequence_no, schedule_id, test_prototype_id,
      write_schedule, todays_test_prototype, current_component,
      downloads_total, downloads_remaining, download_percent,
      zips_remaining, zips_total, zip_percent, downloading_message,
      getting_schedule, downloading, unzipping, unzipping_message,
      randomization_order, salsa_domain, public_key, old_salsadomain, old_salsaid,
      reset_salsaid, uploading_flag, uploads, uploads_total, initial_message, uploads_remaining,
      progress, upload_message, update_uploads, upload, first_ping_status,
      current_test_prototype, taking_scheduled
    }
})