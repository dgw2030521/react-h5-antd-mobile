import { IOInvoker } from '@CodeDefine/customer/Invoker/IOInvoker';

export default function useUploadImage() {
  /**
   * h5上传
   * @param file
   */
  const handleImageUpload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append(
      'stream',
      JSON.stringify({ key: `${new Date().getTime()}_${file.name}` }),
    );
    const { code, result } = await IOInvoker.uploadFile(
      `${new Date().getTime()}_${file.name}`,
      {
        headers: {
          'Content-Type': 'multipart/form-data;charset=UTF-8',
        },
        data: fd,
      },
    );

    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    return result;
  };

  return {
    handleImageUpload,
  };
}
