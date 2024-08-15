import React, { useState } from 'react';
import {
  Dialog,
  ImageUploader,
  ImageUploadItem,
  Space,
  Toast,
} from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import classNames from 'classnames';
import { UploadFileRO } from '@CodeDefine/customer/UploadFileRO';
import styles from './index.module.scss';
import useUploadImage from '@/views/declareForm/useUploadImage';

const maxCount = 5;
const fileSize = 5;
export default function Upload(props: any) {
  const { value = [], onChange } = props;
  const { handleImageUpload } = useUploadImage();

  const [fileList, setFileList] = useState<ImageUploadItem[]>(value);
  const [uploadFileList, setUploadFileList] = useState<UploadFileRO[]>([]);

  function beforeUpload(file: File) {
    if (file.size > fileSize * (1024 * 1024)) {
      Toast.show(`请选择小于 ${fileSize}M 的图片`);
      return null;
    }
    return file;
  }

  const handleUploadNative = async (file: File) => {
    try {
      const result = await handleImageUpload(file);

      setFileList(fileList => [...fileList, { url: result.PreUrl }]);

      const newUploadFileList = [...uploadFileList, result];

      setUploadFileList([...uploadFileList, result]);

      console.log('$$$newUploadFileList', newUploadFileList);

      onChange(JSON.stringify(newUploadFileList));

      return {
        url: result.PreUrl,
      };
    } catch (e) {
      Toast.show({
        content: '上传失败',
        duration: 2000,
        icon: 'fail',
      });
    }
  };

  return (
    <Space direction="vertical">
      <ImageUploader
        value={fileList}
        // capture={'camera'}
        accept={'image/*'}
        upload={handleUploadNative}
        beforeUpload={beforeUpload}
        multiple
        maxCount={maxCount}
        showUpload={fileList.length < maxCount}
        onDelete={() => {
          return Dialog.confirm({
            content: '是否确认删除',
          });
        }}
        onCountExceed={exceed => {
          Toast.show(`最多选择 ${maxCount} 张图片，你多选了 ${exceed} 张`);
        }}
      >
        <div
          className={styles.uploadBtn}
          style={{
            width: 80,
            height: 80,
            borderRadius: 4,
          }}
        >
          <AddOutline style={{ fontSize: 32 }} />
        </div>
      </ImageUploader>
      <div
        className={classNames({
          [styles.placeholder]: true,
        })}
      >
        若营业执照内容有变更，请在此重新上传；
        支持扩展名：pdf、jepg、jpg、png，单文件5M内大小
      </div>
    </Space>
  );
}
