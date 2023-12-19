import { NextApiRequest, NextApiResponse } from "next";
import fs from 'fs';
import path from 'path';
import axios from "axios";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('aaaa')
    if (req.method === 'POST') {
      const {caller_id, icon, icon_path} = req.body;
      console.log(icon)
      if (icon)  {
        res.status(200).json({success: true})
        const matches = icon.match(/^data:image\/([a-zA-Z]+)/);
        const imageExtension = matches && matches[1] ? matches[1] : 'png';
      
        // Create a unique filename based on timestamp
        const filename = `image_${Date.now()}.${imageExtension}`;
        const filePath = path.join(process.cwd(), 'public/customIcons', filename);
        const fileServerPath = `./customIcons/${filename}`;
      
        // Convert base64 to binary data and write to the file
        const data = icon.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(data, 'base64');

        try {
          fs.writeFileSync(filePath, buffer, 'binary');
          axios.post('http://13.212.101.85:3050/contacts/updateImage', {icon: fileServerPath, caller_id}).then(({status, data})=>{
            return res.status(status).json(data)
          }).catch(()=>{
            return res.status(500).json({ error: 'Internal Server Error' });
          })
          // return res.status(200).json({ success: true, filename });
        } catch (error) {
          console.error('Error saving file:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      }else if(icon_path){
        axios.post('http://13.212.101.85:3050/contacts/updateImage', {icon: icon_path, caller_id}).then(({status, data})=>{
            return res.status(status).json(data)
          }).catch(()=>{
            return res.status(500).json({ error: 'Internal Server Error' });
          })
      }else{
        return res.status(400).json({error: 'image not exists'})
      }
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  }