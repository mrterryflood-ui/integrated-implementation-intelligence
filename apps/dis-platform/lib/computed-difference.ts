/** Arithmetic consistency only, never source identity or scientific tolerance.
 * A build-time JSON parser can move a stored subtraction result by one IEEE-754
 * binary64 representable value. Permit only that adjacent value, preserving an
 * exact zero, sign and null. Reference-content comparisons remain exact. */
export function agreesWithComputedDifference(declared:unknown,left:unknown,right:unknown):boolean{
 const finite=(x:unknown):x is number=>typeof x==="number"&&Number.isFinite(x);
 if(left===null||right===null)return declared===null&&(left===null||finite(left))&&(right===null||finite(right));
 if(!finite(declared)||!finite(left)||!finite(right))return false;
 const computed=left-right;
 if(!Number.isFinite(computed))return false;
 if(declared===computed)return true;
 if(declared===0||computed===0||Math.sign(declared)!==Math.sign(computed))return false;
 // Compare adjacent bit patterns instead of an arbitrary decimal/relative
 // epsilon. Unsigned halves avoid rounding the 64-bit representation in JS.
 const bits=new DataView(new ArrayBuffer(8));
 bits.setFloat64(0,Math.abs(declared));const dh=bits.getUint32(0),dl=bits.getUint32(4);
 bits.setFloat64(0,Math.abs(computed));const ch=bits.getUint32(0),cl=bits.getUint32(4);
 return dh===ch&&Math.abs(dl-cl)===1||
  dh+1===ch&&dl===0xffffffff&&cl===0||ch+1===dh&&cl===0xffffffff&&dl===0;
}
