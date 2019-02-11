export const convertObjectIntoFormData = (obj) => {
  let formData = new FormData();
  for (var key in obj) {
    formData.append(key, obj[key]);
  }
  return formData;
};
