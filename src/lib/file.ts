
export interface ITooFile {
    version: number;
    include?: {
        env_files?: string[];
    };
    env?: Record<string, string>;
    var?: Record<string, IVarPicker>;
    prep?: ISequential;
    main: IParallel;
    post?: ISequential;
}
export interface ISequential {
    steps: {
        name?: string;
        run: string;
        label?: string;
        ignore_error?: boolean;
    }[];
}
export interface IParallel {
    jobs: {
        name?: string;
        run: string;
        label?: string;
    }[];
}
interface IVarPicker {
    use?: string;
    generate: string;
    collect?: "stdout" | "stderr";
}
