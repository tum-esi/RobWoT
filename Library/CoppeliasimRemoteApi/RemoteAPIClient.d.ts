declare module 'RemoteAPIClient' {
    export class RemoteAPIClient {
        constructor(host?: string, port?: number, codec?: string, opts?: object);
        call(func: string, args: any[]): Promise<any>;
        getObject(name: string): Promise<any>;
        getObject_(name: string, _info: any): any;
    }
}
