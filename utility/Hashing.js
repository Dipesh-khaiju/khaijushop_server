import crypto from "crypto";

const createSignature =(message)=>{
    const secret = "8gBm/:&EnhH.1/q";
    
    const hmac =crypto.createHmac("sha256",secret);
    hmac.update(message);

    const hashInBase64 =hmac.digest("base64");
    return hashInBase64;

};

export default createSignature;

{/* <button
className="bg-indigo-500 font-semibold hover:bg-indigo-600 py-3 text-sm text-white uppercase w-full"
onClick={handleEsewaPay}
>
PAY WITH ESEWA
</button> */}