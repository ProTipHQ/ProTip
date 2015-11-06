function validAddress(address){
  try {
      new bitcoin.address.fromBase58Check(address.trim());
  } catch (e) {
      return false;
  }
  return true;
}
