import { isLocalhost } from "./isLocalHost"

interface ENV {
    [word: string]: {
        development: string,
        local: string,
        production: string
    }
}

export const GetEnv = (word: string) => {
    let env 
    const local = isLocalhost

    if(process.env.NODE_ENV === 'development' && local){
        env = 'local'
    } else if(process.env.NODE_ENV === 'development') {
        env = process.env.NODE_ENV
    } else {
        env = process.env.NODE_ENV
    }

    return envList[word][env]
}

const envList: ENV = {
    'rating_url': {
        local: 'http://localhost:8080/mock',
        development: 'http://dev-botdesigner-app-rating.s3-website-sa-east-1.amazonaws.com/mock',
        production: 'https://avaliacao.botdesigner.io/mock'
    },
}