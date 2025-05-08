export const getKeyByValue = <T,U>(map:Map<T, U>, value: U)=>{
    for(let [key, val] of map.entries()){
        if(value === val ){
            console.log(value)
            return key;
        }
    }
}

export const transformMapToObject = <T,U>(map:Map<T,U>)=>{
    let transformedObj:{[s:string]: U} = {};
    for(let [key, val] of map.entries()){
        transformedObj[`${key}`] = val;
    }
    return transformedObj;
}