/**
 * 单选的checkbox，比如同意协议
 */
import React from 'react';
import { Checkbox } from 'antd-mobile';

export default function MyCheckBoxSingle(props: any) {
  const { schema, value, onChange } = props;

  return (
    <Checkbox checked={value} onChange={onChange}>
      {schema.title}
    </Checkbox>
  );
}
