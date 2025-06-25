export enum CustomEnvs {
    rating_url = 'rating_url',
    rating_api_uri = 'rating_api_uri',
}

type Env = {
    [value in CustomEnvs]: {
        development: string;
        local: string;
        production: string;
    };
};

const envList: Env = {
    [CustomEnvs.rating_url]: {
        local: 'http://localhost:8080',
        development: 'http://dev-botdesigner-app-rating.s3-website-sa-east-1.amazonaws.com',
        production: 'https://avaliacao.botdesigner.io',
    },
    [CustomEnvs.rating_api_uri]: {
        local: process.env.API_URI,
        development: process.env.API_URI,
        production: 'https://atend.clinic',
    },
};

export const getEnv = (value: CustomEnvs): string => {
    const env = process.env.NODE_ENV;
    return envList?.[value][env];
};
