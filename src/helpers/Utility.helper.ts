export const getKeyByValue = <T,U>(map:Map<T, U>, value: U)=>{
    for(let [key, val] of map.entries()){
        if(value === val ){
            return key;
        }
    }
}