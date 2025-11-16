import * as openpgp from 'openpgp'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { toDisplayString } from 'vue'



type TestFile<T extends (string | Uint8Array)> = {
    name:string,
    body:T extends string? string : Uint8Array
    format: T extends string ? "string" : "binary"
}

export  async function save_encrypt_message_response<T extends (string|Uint8Array)>(
  f:TestFile<T>, 
  schedule_id:string, 
  response_code:string, 
  test_prototype_id:string, 
  sequence_no:number,
  public_key_armored: string
  ){
    const publicKey = await openpgp.readKey({
        armoredKey: public_key_armored
    })
    const name = f.name
    //const file_buffer = await f.arrayBuffer()
    let message = null
    if (f.format==='binary'){
        message = await openpgp.createMessage({
            //binary: new Uint8Array(file_buffer)
            binary:f.body
        })
    } else {
        message = await openpgp.createMessage({
            //binary: new Uint8Array(file_buffer)
            text:f.body
        }) 
    }
    //@ts-expect-error
    const encrypted: string = await openpgp.encrypt({
        message,
        encryptionKeys: publicKey,
        format: 'armored'
    })
    await Filesystem.writeFile({
        directory:Directory.External,
        path:`awaiting-upload/${schedule_id}|${response_code}|${test_prototype_id}|${sequence_no}|${new Date().toISOString()}|${f.name}.gpg`,
        recursive:true,
        data:encrypted,
        encoding:Encoding.UTF8
    })
}

