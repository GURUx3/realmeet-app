interface EnvironmentConfig {
    database: {
        url: string;
    };
    clerk: {
        secretKey: string;
    };
    server: {
        port: number;
        nodeEnv: string;
    };
    cors: {
        clientUrl: string;
    };
}
export declare const env: EnvironmentConfig;
export {};
//# sourceMappingURL=env.d.ts.map