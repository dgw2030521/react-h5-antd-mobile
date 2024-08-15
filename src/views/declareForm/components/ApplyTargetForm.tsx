import React, { RefObject } from 'react';
import { Form, Input, Picker, PickerRef, Space } from 'antd-mobile';
import classNames from 'classnames';
import type { FormInstance } from 'antd-mobile/es/components/form';
import styles from '@/views/declareForm/index.module.scss';
import FormBox from '@/views/declareForm/widgets/formBox';
import UploadImage from '@/views/declareForm/Upload';

interface ApplyTargetFormProps {
  form: FormInstance;
}
export default function ApplyTargetForm(props: ApplyTargetFormProps) {
  const { form } = props;
  return <div>头部表单</div>;
}
