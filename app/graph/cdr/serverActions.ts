'use server'

import axios from "axios";
import { CallerType } from "./page";

export const getCallersAction = async ({from, to, search}: {from: Date, to: Date, search: {id: string, info: string}}): Promise<{success: boolean; result: CallerType[]}> => {

    // setReading(true);
    return axios
        .get(`${process.env.NEXT_PUBLIC_API}/user/callers`, {
            params: { from: from.toISOString(), to: to.toISOString(), ...search },
        })
        .then(({data}) => {
            console.log(data)
            return data;
        });
};
