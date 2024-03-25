import createSignature from "../utility/Hashing.js";

const handleEsewaSuccess = (req, res, next) => {
  try {
    const { data } = req.query;
  
    const decodedData = atob(data) // atob sunction decodes base 64  encoded string into javascript
    
    console.log(decodedData);

    if (decodedData?.status !== "COMPLETE") {
      return res.json({ message: "Payment Failed" });
    }
    const message = decodedData?.signed_field_names
      .split(",")
      .map((field) => `${field}=${decodedData[field] || ""}`)
      .join(",");
    console.log(message);

    const signature = createSignature(message);
    if (signature !== decodedData?.signature) {  //checks if the generated signature matches the signature value in the decodedData
      res.json({ message: "Payment Failed" });
    }
    req.transaction_uuid = decodedData?.transaction_uuid;
    req.transaction_code = decodedData?.transaction_code;
    next();
  }
  
  catch (error) {
    console.log(error);
    return res.json({ message: "Error Occured" });
  }
};
export default handleEsewaSuccess;