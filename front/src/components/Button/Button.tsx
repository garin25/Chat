import "./Button.css"

export interface Props{
    label:string,
    parentMethod: ()=>void
}
// se puede hacer sin interface igual
export const Button = ({label,parentMethod}:Props)=>{ 
  return (
    <>
     <button className='custom-button' onClick={parentMethod}>
          {label}
        </button>
    </>
  )
}