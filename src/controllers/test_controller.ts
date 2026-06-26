import {Request, Response} from "express";

export const hello =(req : Request, res : Response) => {
    res.status(200).json({success: true, data: {message : "Hello World"}});
}

export const echoBodey = (req : Request, res : Response) => {
    res.status(200).json({success: true, data: {youSent : req.body}});                
}

export const getById = (req : Request, res : Response) => {
    const id = req.params.id;
    res.status(200).json({success: true, data: {youSent : id , message : "This is a get request with id"}});                
}


