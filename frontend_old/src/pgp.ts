import * as openpgp from 'openpgp'
import JSZip from 'jszip'

export default function upload_message_response(files: File[], response_code:string, test_prototype_id:string){
    const zipper = new JSZip()
    const public_key_armored = `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
mihNsTEaohcecE6Z
=sv8/
-----END PGP PUBLIC KEY BLOCK-----`;
        async function upload_encrypt(){
            let saved_folder = zipper.folder('saved_folder')!
            for (let f of (files)){
                let name = f.name
                saved_folder.file(name, f)
            }
            const zip_file = await zipper.generateAsync({type:'blob'})
            const publicKey = await openpgp.readKey({
                armoredKey: public_key_armored
            })
            const zipfile_buffer = await zip_file.arrayBuffer()
            console.log(zipfile_buffer)
            const message = await openpgp.createMessage({
                binary: new Uint8Array(zipfile_buffer)
            })
            const encrypted = await openpgp.encrypt({
                message,
                encryptionKeys: publicKey,
                format: 'binary'
            })
            const fd = new FormData()
            console.log(encrypted)
            // @ts-expect-error
            fd.append('upload_zip_pgp', new Blob([encrypted.buffer]))
            return fetch('/salsa/server/api/upload-response-file?' + new URLSearchParams(
                {
                    subject_id:response_code,
                    test_prototype_id,
                    schedule_id:crypto.randomUUID()
                }
            ), {
                method: 'POST',
                body: fd,
            })
        }
        return upload_encrypt()
}