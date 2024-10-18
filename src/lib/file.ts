
export interface ITooFile {
    version: number;
    include: string[];
    env?: Record<string, string>;
    var?: Record<string, IVarPicker>;
    prep?: ISequential;
    main: IParallel;
    post?: ISequential;
}
export interface ISequential {
    steps: {
        name: string;
        run: string;
        ignore_error?: boolean;
    }[];
}
export interface IParallel {
    jobs: {
        name: string;
        label: string;
        run: string;
    }[];
}
interface IVarPicker {
    use?: string;
    generate: string;
    pick?: "stdout" | "stderr";
}
