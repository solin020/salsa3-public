import {Filesystem,Directory,Encoding} from '@capacitor/filesystem'


function readDataUrl(f:File): Promise<string>{
    return new Promise((resolve, reject) => {
      var fr = new FileReader()
      fr.onload = () => {
        resolve(((fr.result)!).toString())
      }
      fr.onerror = reject
      fr.readAsDataURL(f)
    })
  }

export default async function write_file(arg:{f:File, path:string}){
    const {f, path} = arg
    if (f.type==='text/plain'){
            await Filesystem.writeFile({
                path,
                directory: Directory.External,
                data: await f.text(),
                encoding: Encoding.UTF8,
                recursive:true
            })
        }
    else {
        await Filesystem.writeFile({
            path,
            directory: Directory.External,
            data: await readDataUrl(f),
            encoding: Encoding.UTF8,
            recursive:true
        })
    }
}