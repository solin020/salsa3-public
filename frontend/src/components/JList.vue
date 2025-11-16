<template>
    <div>
    </div>
    <div class="j_list_container">
        <div class="j_header_container">
            <br/>
            <div class="j_list_header">
                <slot name="preamble"/>
            </div>
            <div class="j_divider"/>
            <div style="overflow-y: scroll; max-height: 50vh; max-width: 50vw;"  ref="scrollref">
                <template v-for="(item, idx) in props.items">
                        <div v-if="!props.fixed_order"
                            :class="{
                                j_list_gap: idx!==active_gap,
                                j_expand_gap: idx===active_gap
                            }"
                            @dragenter="gap_dragenter($event, idx)"
                            @dragleave="gap_dragleave($event)"
                            @dragover="gap_dragover($event)"
                            @drop="header_drop($event, idx)"
                        />
                        <button
                            v-if="!props.fixed_order"
                            draggable="true"
                            :class="['button-7', 'j_list_header', 'j_grabbable',{
                                j_viewing:item.__jlist_id===active_item,
                                j_list_special:props.is_special(item),
                                j_list_normal:!props.is_special(item),
                                }]"
                            @dragstart="header_dragstart($event, idx)"
                            @dragend="header_dragend($event)"
                            @click="header_click(item.__jlist_id!)"
                            >
                            <input type="text" v-model="item.id" v-if="typeof(item.id)==='string' && !props.uneditable" style="color:white;"/>
                            <span v-else-if="typeof(item.id)==='string' && props.uneditable" style="color:white;">{{item.id}}</span>
                            <span v-else style="color:white;">{{idx + 1}}</span>
                        </button>
                        <button v-else
                            :class="['button-7', 'j_list_header',{
                                j_viewing:item.__jlist_id===active_item,
                                j_list_special:props.is_special(item),
                                j_list_normal:!props.is_special(item),
                            }]"
                            @click="header_click(item.__jlist_id!)"
                            size="medium">
                            <input type="text" v-model="item.id" v-if="typeof(item.id)==='string' && !props.uneditable" style="color:white;"/>
                            <span v-else-if="typeof(item.id)==='string' && props.uneditable" style="color:white;">{{item.id}}</span>
                            <span v-else style="color:white;">{{idx + 1}}</span>
                        </button>

                </template>
                <div
                    v-if="!props.fixed_order"
                    :class="{
                            j_list_gap: -1!==active_gap, 
                            j_expand_gap: -1===active_gap, 
                        }"
                    @dragenter="gap_dragenter($event, -1)"
                    @dragleave="gap_dragleave($event)"
                    @dragover="gap_dragover($event)"
                    @drop="header_drop($event, -1)"
                    />
            </div>
            <div class="j_divider"/>
            <div class="j_list_header">
                <slot name="postamble"/>
            </div>
        </div>
        <div  v-for="item, idx in props.items"
            :class="{j_active_item:item.__jlist_id===active_item,j_passive_item: item.__jlist_id!==active_item}">
            <slot name="renderer" :item="item" :idx="idx"/>
        </div>
    </div>
</template>
<script lang="ts" setup generic="T extends {id?: string, __jlist_id?:number}">
import {ref, type Ref} from 'vue'


interface Props<T>{
    items: T[],
    mime_methods?: Map<string, (f:File, idx:number)=>void>,
    fixed_order?: boolean
    is_special?: (a:T)=>boolean
    uneditable?: boolean
}
const id_creator = function*(){
    let i = 0
    while (true){
        yield i
        i += 1
    }
}()
const props = withDefaults(defineProps<Props<T>>(),
    // @ts-expect-error
    {mime_methods: new Map(), fixed_order: false, is_special:((_)=>false)}
)

const scrollref: Ref<HTMLElement|undefined> = ref()

function add_jlist_id(item:T){
    Object.defineProperty(item, '__jlist_id', {value: id_creator.next().value!, writable:true, enumerable:false})
}


props.items.forEach(i=>add_jlist_id(i))

props.items.push = function(...items:T[]){
    items.forEach(i=>add_jlist_id(i))
    setTimeout(()=>{
        //this makes sure that once the list gets big enough users can see newly added items
        scrollref.value!.scrollTop = scrollref.value!.scrollHeight
    }, 100)
    return Array.prototype.push.apply(this, items)
}



const active_item = ref(0)
const active_file: Ref<File|null> = ref(null)

function mime_accepted(e:DragEvent):('copy'|'move'|''){
    const arr = [...props.mime_methods.keys()]
    if (e.dataTransfer){
        if (e.dataTransfer.types.includes('application/number')){
            return 'move'
        } else{
            const filetypes = []
            for (let item of e.dataTransfer.items){
            if (item.kind==='file'){
                filetypes.push(item.type)
            }
        }
            if(filetypes.some(s => arr.includes(s)) && e.dataTransfer.files.length === 0){
                return 'copy'
            }
        }
    } 
    return ''
}

function header_click(__jlist_id:number){
    active_item.value=__jlist_id
}

const active_gap: Ref<number|null> = ref(null)

function gap_dragenter(e:DragEvent, idx: number){
    if (mime_accepted(e)){
        e.preventDefault()
        active_gap.value = idx
    }
}
function gap_dragover(e:DragEvent){
    let transfer_type = mime_accepted(e)
    if (transfer_type && e.dataTransfer){
        e.dataTransfer.dropEffect = transfer_type;
        e.preventDefault()
    }
}
function gap_dragleave(e:DragEvent){
    e.preventDefault()
    active_gap.value = null
}



function header_dragstart(e: DragEvent, idx: number){
    console.log('started', idx)
    if (e.dataTransfer){
        e.dataTransfer.setData('application/number', `${idx}`)
        e.dataTransfer.effectAllowed='copyMove'
        setTimeout(function(){
            // @ts-expect-error
            e.target.style.visibility = "hidden";
            // @ts-expect-error
            e.target.style.height = "0";
        }, 0);
    }
}
function header_dragend(e:DragEvent){
    // @ts-expect-error
    e.target.style.visibility = "visible";
    active_gap.value = null
}


function header_drop(e:DragEvent, target_idx: number){
    active_gap.value = null
    if (e.dataTransfer){
        let dids = e.dataTransfer.getData('application/number')
        if (dids){
            let didx: number = parseInt(e.dataTransfer.getData('application/number'))
            let move_el = props.items.splice(didx, 1)[0]
            if(target_idx === -1){
                props.items.push(move_el)
            } else if (didx<target_idx){
                props.items.splice(target_idx-1,0,move_el)
            }
            else{
                props.items.splice(target_idx,0,move_el)
            }
        } else{
            const filetypes = []
            for (let item of e.dataTransfer.items){
                if (item.kind==='file'){
                    filetypes.push(item.type)
                }
            }
            for (let t of filetypes){
                console.log(t, props.mime_methods)
                let fun = props.mime_methods.get(t)
                if (fun){
                    fun(e.dataTransfer.files[0], target_idx)
                    break
                }
            }
        }
    }
    e.preventDefault()
}






</script>
<style>
.j_list_container{
    display: grid;
    grid-template-columns: 1fr 2fr;
    grid-auto-rows: max-content
}

.j_active_item{
    grid-row: 1 / -1;
    grid-column-start: 2;
    grid-column-end: 3;
}
.j_passive_item{
    display: none;
}
.j_header_container {
    grid-column-start: 1;
    grid-column-end: 2;
    border-right: 2px solid #3e648d;
}
.j_list_gap{
    height: 2rem;
    background-color:white;
}
.j_expand_gap{
    height: 6rem;
    transition: height 1s;
    animation: j_blink 1.5s infinite;
}
@keyframes j_blink{
  0% {
    background: tan;
  }
  50%{
    background: white;
  }
  100% {
    background: tan;
  }
}
.j_list_header{
    min-height: 3rem;
    width: 80%;
    margin-left: 20px;
    margin-right: 20px;
    &.j_grabbable{
        z-index:1;
    }
    &.j_grabbable:hover{
        cursor:grab
    }
    &.j_grabbable::before{
        content: '↕️';
    }
    &.j_viewing{
        box-shadow: 0 0 0 4px rgba(1, 48, 82, 0.45);
        border-color: black;
        border-style:inset;
        border-width:8px;
        &:hover{
            cursor:pointer;
        }
    }
    &.j_list_normal{
        background-image:var(--salsablue);
    }
    &.j_list_special{
        background-color:darkgreen;
    }
}
</style>