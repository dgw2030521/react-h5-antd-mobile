import React from 'react';
import { Input, Space } from 'antd-mobile';
import styles from './index.module.scss';

export default function MyNumber(props: any) {
  const { schema, value, onChange } = props;

  return (
    <Space className={styles.inputBox}>
      <Input
        style={{ '--text-align': 'right' }}
        type="number"
        className={styles.input}
        placeholder="请输入数字"
        defaultValue={value}
        onChange={onChange}
      />
      <span className={styles.icon}>{schema.UnitName || '测试单位'}</span>
    </Space>
  );
}
