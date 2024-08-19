import { Button, Checkbox, Form, Toast } from 'antd-mobile';
import classNames from 'classnames';
import { useForm } from 'form-render-mobile';
import { isEmpty } from 'lodash-es';
import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import ImgIndexBg from '@/assets/policyDetail/bg.png';
import policyStatusIcon from '@/assets/policyDetail/policyStatus.png';
import BaseForm from '@/views/declareForm/components/BaseForm';
import MetaForm from '@/views/declareForm/components/MetaForm';
import useDeclareForm from '@/views/declareForm/useDeclareForm';
import FormBox from '@/views/declareForm/widgets/formBox';

import styles from './index.module.scss';

export default function DeclareInfo() {
  const { id: bodyId } = useParams();
  const [searchParams] = useSearchParams();
  const urlPolicyId = searchParams.get('policyId');
  const urlDraftId = searchParams.get('draftId') || '-1';

  const [baseForm] = Form.useForm();
  const metaForm = useForm();

  const {
    policyStatusName,
    policyTypeNames,
    policyInfo,
    getDraftDetail,
    getAllPolicyType,
    getPolicyInfo,
    getApplyPromise,
    draftDetail,
  } = useDeclareForm();

  const handleSave = async () => {
    const [baseValues, metaValues] = await Promise.all([
      baseForm.getFieldsValue(),
      metaForm.getFieldsValue(),
    ]);
    console.log('###no validate baseValues', baseValues);
    console.log('###no validate metaValues', metaValues);
  };

  const handleSubmitApply = async () => {
    const [baseValues, metaValues] = await Promise.all([
      baseForm.validateFields(),
      metaForm.validateFields(),
    ]);

    console.log('###validate baseValues', baseValues);
    console.log('###validate metaValues', metaValues);
  };

  /**
   * 初始化表单渲染
   * @param bodyId
   */
  const initPage = async (bodyId: string) => {
    try {
      // 政策类型
      await getAllPolicyType();
      // 获取承诺函
      await getApplyPromise(bodyId);
      await getPolicyInfo(bodyId);
      await getDraftDetail(bodyId, urlDraftId);
    } catch (e) {
      Toast.show({
        content: e.Message || '加载失败',
        duration: 2000,
        icon: 'fail',
      });
    }
  };

  useEffect(() => {
    // bodyId来自url
    if (!bodyId) return;
    initPage(bodyId);
  }, [bodyId]);

  if (isEmpty(policyInfo)) return null;

  return (
    <div className={styles.container}>
      <div className={`${styles.header}`}>
        <img className={styles.imageBg} src={ImgIndexBg} />
        <div className={styles.title}>
          <span className={styles.desc}>{policyInfo?.PolicyName}</span>
          <div className={styles.tagContainer}>
            {policyTypeNames?.map(i => (
              <div className={styles.tag} key={i}>
                {i}
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.policyStatus}`}>
          <img src={policyStatusIcon} />
          <span
            className={
              policyStatusName?.length === 4 ? styles.span4 : styles.span3
            }
          >
            {policyStatusName}
          </span>
        </div>
      </div>
      <div className={styles.content}>
        <BaseForm
          bodyId={bodyId}
          form={baseForm}
          policyInfo={policyInfo}
          draftDetail={draftDetail}
        />
        <MetaForm
          bodyId={bodyId}
          form={metaForm}
          policyInfo={policyInfo}
          draftDetail={draftDetail}
        />

        <FormBox title="承诺函" hideExpandBtn>
          <div className={styles.promiseBox}>
            <div className={styles.content}>
              本单位申报青羊区支持本地重大节庆消费类活动发展政策，所填报的信息均真实、准确、合法，所有提交材料均真实有效。如有不实之处，愿负相应的法律责任，并承担由此产生的一切后果。
              特此承诺！
            </div>
            <div className={styles.operate}>
              <Checkbox checked disabled>
                阅读并签订承诺函
              </Checkbox>
            </div>
          </div>
        </FormBox>
      </div>
      <div className={styles.btnContainer}>
        <Button
          className={classNames({
            [styles.btn]: true,
            [styles.save]: true,
          })}
          onClick={() => {
            handleSave();
          }}
        >
          保存
        </Button>
        <Button
          onClick={() => {
            handleSubmitApply();
          }}
          className={classNames({
            [styles.btn]: true,
            [styles.submit]: true,
          })}
        >
          提交申请
        </Button>
      </div>
    </div>
  );
}
