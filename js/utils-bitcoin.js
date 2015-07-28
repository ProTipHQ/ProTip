function validAddress(address){
  try {
      new Bitcoin.Address(address.trim());
  } catch (e) {
      return false;
  }
  return true;
}
