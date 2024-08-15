import { ApplyPeriodType } from '@CodeDefine/customer/ApplyPeriodType';
import { AreaViewRO } from '@CodeDefine/customer/AreaViewRO';
import { PolicyGetMetaRO } from '@CodeDefine/customer/PolicyGetMetaRO';
import { PolicyMatterType } from '@CodeDefine/customer/PolicyMatterType';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Picker,
  PickerRef,
  Space,
  Toast,
} from 'antd-mobile';
import classNames from 'classnames';
import FormRender, { useForm } from 'form-render-mobile';
import { filter, isEmpty, map } from 'lodash-es';
import moment from 'moment';
import React, { RefObject, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import ImgIndexBg from '@/assets/policyDetail/bg.png';
import policyStatusIcon from '@/assets/policyDetail/policyStatus.png';
import { IsJsonString } from '@/views/declareForm/commonTools';
import UploadImage from '@/views/declareForm/Upload';
import useDeclareForm from '@/views/declareForm/useDeclareForm';
import {
  createFormSchemaByMetaList,
  flattenMetaList,
} from '@/views/declareForm/utils';
import FormBox from '@/views/declareForm/widgets/formBox';
import IOInvokerUpload from '@/views/declareForm/widgets/IOInvokerUpload';
import MyLink from '@/views/declareForm/widgets/link';
import MyCheckBoxMultiple from '@/views/declareForm/widgets/MyCheckBoxMultiple';
import MyNumber from '@/views/declareForm/widgets/MyNumber';
import MySelect from '@/views/declareForm/widgets/MySelect';

import styles from './index.module.scss';
import MyCheckBoxSingle from './widgets/MyCheckBoxSingle';

export default function DeclareInfo() {
  const { id: bodyId } = useParams();
  const [searchParams] = useSearchParams();
  const urlPolicyId = searchParams.get('policyId');
  const urlDraftId = searchParams.get('draftId') || '-1';
  const LoginScriptValue = JSON.parse(
    localStorage.getItem('LoginScriptValue') || null,
  );
  // 当前城市
  const [city, setCity] = useState(null);
  // 当前区县
  const [area, setArea] = useState(null);
  const [streetList, setStreetList] = useState([]);

  const [loading, setLoading] = useState(false);
  // 申报周期
  const [versionCode, setVersionCode] = useState(null);
  const [cycleList, setCycleList] = useState([]);

  // 营业执照
  const [businessLicense, setBusinessLicense] = useState([]);

  const [policyConfigMeta, setPolicyConfigMeta] =
    useState<PolicyGetMetaRO>(null);

  const [renderSchema, setRenderSchema] = useState({});

  const [baseForm] = Form.useForm();
  const autoForm = useForm();

  const {
    policyStatusName,
    policyTypeNames,
    policyInfo,
    getApplyVersionCodeRange,
    getDraftDetail,
    getLatestApplyTargetInfo,
    areaList,
    getPolicyConfigMeta,
    getAllPolicyType,
    getPolicyInfo,
    getAreaDict,
    getCompanyBank,
    getPersonBank,
    getApplyPromise,
  } = useDeclareForm();

  /**
   * 设置表单初始值
   */
  const setInitialValues = async () => {};

  /**
   * 获取meta信息并根据draftId设置初始值
   * @param draftId
   * @param defaultExpand 获取policy类型是免申还是需要申报
   */
  const getMetaDetail = async (draftId: string, defaultExpand: boolean) => {
    console.log(draftId);
    const companyBank = await getCompanyBank();
    const personBank = await getPersonBank();
    const meta = await getPolicyConfigMeta(bodyId);
    const metaListArr = flattenMetaList(meta);
    const renderSchema = createFormSchemaByMetaList(
      metaListArr,
      {
        companyBank,
        personBank,
      },
      // @todo 设置默认值
      {},
      defaultExpand,
    );

    setRenderSchema(renderSchema);

    // if (draftId !== '0') {
    //   //   有草稿 getDraftMetaDetailByMetaID
    // } else {
    //   //   无草稿 getApplyInfo
    // }
  };

  const getApplyFormConfigDetail = async (bodyId: string) => {
    const policyInfo = await getPolicyInfo(bodyId);
    //  获取草稿
    const draftDetail = await getDraftDetail(bodyId, urlDraftId);
    const draftId = draftDetail.ID;

    // 获取申报周期
    const period = policyInfo.ApplyPeriod;
    const leftDate = policyInfo.CreateTime;
    const leftCount = 3;
    const rightDate = moment().format('YYYY-MM-DD HH:mm:ss');
    const rightCount = 3;

    const resultCircle = await getApplyVersionCodeRange(
      period,
      leftDate,
      leftCount,
      rightDate,
      rightCount,
    );
    if (policyInfo.ApplyPeriod._value === ApplyPeriodType.ONCE.Value) {
      setCycleList([]);
    } else {
      const currentDateIndex = resultCircle.length - rightCount - 1;
      if (draftId === '0') {
        setVersionCode(resultCircle[currentDateIndex]);
      } else {
        setVersionCode(draftDetail.VersionCode);
      }

      setCycleList(
        map(resultCircle, item => {
          return { label: item, value: item };
        }),
      );
    }

    // 设置营业执照
    if (
      draftId !== '0' &&
      draftDetail?.AttachProof &&
      IsJsonString(draftDetail?.AttachProof)
    ) {
      const fileBusiness = JSON.parse(draftDetail.AttachProof)[0];
      if (!fileBusiness) return;

      // form.setFieldsValue({
      //   AttachProof: fileBusiness,
      // });

      setBusinessLicense(
        !fileBusiness
          ? []
          : [
              {
                Name: fileBusiness?.Name,
                status: 'done',
                Key: fileBusiness?.Key,
                Url: fileBusiness?.Url,
              },
            ],
      );
    }

    const defaultExpand =
      policyInfo.PolicyMatterType._value === PolicyMatterType.NO_APPLY.Value;

    await getMetaDetail(draftId, defaultExpand);
  };

  /**
   * 获取申报信息
   * @param bodyId
   */
  const getApplyTargetInfo = async (bodyId: string) => {
    const { AttachProof, AreaId, StreetAreaId, CityAreaId } =
      await getLatestApplyTargetInfo();

    // 地域信息
    // form.setFieldsValue({
    //   City: CityAreaId === '0' ? undefined : CityAreaId,
    //   AreaID: AreaId === '0' ? undefined : AreaId,
    //   Street: StreetAreaId === '0' ? undefined : StreetAreaId,
    // });

    // 营业执照
    if (AttachProof) {
      const fileBusiness = JSON.parse(AttachProof)[0];
      // form.setFieldValue('AttachProof', AttachProof);

      setBusinessLicense(
        !fileBusiness
          ? []
          : [
              {
                Name: fileBusiness?.Name || fileBusiness?.fileName,
                status: 'done',
                Key: fileBusiness?.Key || fileBusiness?.fileKey,
                Url: fileBusiness?.Url,
              },
            ],
      );
    }

    setArea(AreaId);
    setCity(CityAreaId);

    getApplyFormConfigDetail(bodyId);
  };

  /**
   * 初始化对应的区域块
   *  public static readonly NONE = new ViEnum(0, "无", "", "NONE");
   *  public static readonly PROVINCE = new ViEnum(1, "省级", "", "PROVINCE");
   *  public static readonly CITY = new ViEnum(2, "市级", "", "CITY");
   *  public static readonly AREA = new ViEnum(3, "区县级", "", "AREA");
   *  public static readonly STREET = new ViEnum(4, "街道级", "", "STREET");
   *  public static readonly COMMUNITY = new ViEnum(5, "社区级", "", "COMMUNITY");
   * @param item
   */
  const initFieldItem = (item: AreaViewRO) => {
    if (item.Type._value === 2) {
      baseForm.setFieldsValue({
        City: item.ID,
      });
      setCity(item.ID);
    }
    if (item.Type._value === 3) {
      baseForm.setFieldsValue({
        AreaID: item.ID,
      });
      setArea(item.ID);
    }
    if (item.Type._value === 4) {
      baseForm.setFieldsValue({
        Street: item.ID,
      });
    }
  };

  // useEffect(() => {
  //   if (isEmpty(areaList) || isEmpty(policyInfo)) return;
  //   const currentArea = find(areaList, item => item.ID === policyInfo?.Area);
  //   initFieldItem(currentArea);
  //
  //   const parentArea = find(
  //     areaList,
  //     item => item.ID === currentArea.Parent.ID,
  //   );
  //
  //   initFieldItem(parentArea);
  //
  //   const childrenList = filter(areaList, item => {
  //     return item.Parent.ID === currentArea.ID;
  //   });
  //
  //   console.log('###currentArea', {
  //     areaList,
  //     currentArea,
  //     parentArea,
  //     childrenList,
  //   });
  //
  //   const allAreas = [currentArea, parentArea, ...childrenList]?.map(item => {
  //     return {
  //       label: item.Name,
  //       value: item.ID,
  //       type: item.Type,
  //       parentId: item.Parent.ID,
  //     };
  //   });
  //
  //   setStreetList(
  //     allAreas.filter(
  //       item =>
  //         item.type === 4 && (item.parentId === area || item.parentId === '0'),
  //     ),
  //   );
  //
  //   setChooseAreaList(allAreas);
  // }, [areaList, policyInfo, area]);

  const handleSave = () => {
    baseForm.validateFields().then(values => {
      Toast.show({
        content: '保存成功',
      });
    });
  };

  /**
   * 初始化表单渲染
   * @param bodyId
   */
  const initPageForm = async (bodyId: string) => {
    setLoading(true);
    try {
      // 政策类型
      await getAllPolicyType();
      // 区域信息
      await getAreaDict();
      // 获取承诺函
      await getApplyPromise(bodyId);
      /**
       * 个人账号，不需要走获取营业执照
       */
      const LoginScriptValue = JSON.parse(
        localStorage.getItem('LoginScriptValue') || '{}',
      );
      // 企业账号
      if (LoginScriptValue?.LoginType === 1) {
        await getApplyTargetInfo(bodyId);
      } else {
        // 个人账号
        await getApplyFormConfigDetail(bodyId);
      }
      setLoading(false);
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
    initPageForm(bodyId);
  }, [bodyId]);

  // 区域
  const cityRenderList = filter(areaList, item => {
    return item.Type._value === 2;
  });
  const areaRenderList = filter(areaList, item => {
    return item.Type._value === 3;
  });
  const streetRenderList = filter(areaList, item => {
    return item.Type._value === 4;
  });

  const changePickerData = (list: AreaViewRO[]) => {
    return map(list, item => {
      return {
        label: item.Name,
        value: item.ID,
        type: item.Type,
        parentId: item.Parent.ID,
      };
    });
  };

  useEffect(() => {
    if (loading) {
      Toast.show({
        content: '加载中',
        duration: 0,
        icon: 'loading',
      });
    } else {
      Toast.clear();
    }
  }, [loading]);

  if (isEmpty(policyInfo)) return null;

  return (
    <div className={styles.container}>
      <div className={`${styles.header} `}>
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
        <Form
          layout="horizontal"
          className={styles.form}
          form={baseForm}
          onFinish={console.log}
        >
          <div className={styles.card_single}>
            <Form.Item
              className={styles.formItem}
              label="申报周期"
              name="versionCode"
              trigger="onConfirm"
              onClick={(e, pickerRef: RefObject<PickerRef>) => {
                pickerRef.current?.open();
              }}
              rules={[
                {
                  required: true,
                  message: '请选择申报周期',
                },
              ]}
            >
              <Picker columns={[cycleList]}>
                {items => {
                  return (
                    <div className={styles.picker}>
                      {items.map((item, index) => (
                        <span key={index}>{item.label}</span>
                      ))}
                    </div>
                  );
                }}
              </Picker>
            </Form.Item>
          </div>
          <FormBox title="申报对象情况" expand>
            {policyInfo?.ApplySource?._value === 2 ? (
              <Form.Item
                name="CompanyName"
                label={<div className={styles.label}>申报企业名称</div>}
                rules={[{ required: true, message: '必填项' }]}
                initialValue={LoginScriptValue?.CompanyName}
              >
                <Input disabled onChange={console.log} placeholder="请输入" />
              </Form.Item>
            ) : null}
            <Form.Item
              name="IdCard"
              label={
                <div className={styles.label}>
                  {policyInfo?.ApplySource?._value === 2
                    ? '申报企业统一社会信用代码'
                    : '申报人身份证号'}
                </div>
              }
              rules={[{ required: true, message: '必填项' }]}
              initialValue={
                policyInfo?.ApplySource?._value === 2
                  ? LoginScriptValue?.CreditCode
                  : LoginScriptValue?.IdCard
              }
            >
              <Input disabled onChange={console.log} placeholder="请输入" />
            </Form.Item>

            <Form.Item
              name="Name"
              label={<div className={styles.label}>申报人姓名</div>}
              rules={[{ required: true, message: '必填项' }]}
              initialValue={
                policyInfo?.ApplySource?._value === 2
                  ? LoginScriptValue?.CompanyManagerName
                  : LoginScriptValue?.Name
              }
            >
              <Input disabled onChange={console.log} placeholder="请输入" />
            </Form.Item>

            <Form.Item
              name="Phone"
              label={<div className={styles.label}>申报人手机号</div>}
              rules={[{ required: true, message: '必填项' }]}
              initialValue={
                policyInfo?.ApplySource?._value === 2
                  ? LoginScriptValue?.CompanyManagerPhone
                  : LoginScriptValue?.Phone
              }
            >
              <Input disabled onChange={console.log} placeholder="请输入" />
            </Form.Item>

            <Form.Item
              className={styles.formItem}
              name="City"
              label={<div className={styles.label}>所属市级</div>}
              rules={[
                {
                  required: policyInfo?.AreaType?._value === 2,
                  message: '请选择所属市级',
                },
              ]}
              trigger="onConfirm"
              onClick={(e, pickerRef: RefObject<PickerRef>) => {
                pickerRef.current?.open();
              }}
            >
              <Picker
                columns={[changePickerData(cityRenderList)]}
                onConfirm={val => {
                  setCity(val);
                  console.log('---val', val);
                  // form.setFieldsValue({
                  //   AreaID: null,
                  //   Street: null,
                  // });
                }}
              >
                {items => {
                  return (
                    <Space align="center">
                      {items.every(item => item === null) ? (
                        <span className={styles.placeholder}>请选择</span>
                      ) : (
                        items.map(item => item?.label ?? '未选择').join(' - ')
                      )}
                    </Space>
                  );
                }}
              </Picker>
            </Form.Item>

            <Form.Item
              className={styles.formItem}
              name="AreaID"
              label={<div className={styles.label}>所属区县</div>}
              rules={[
                {
                  required: policyInfo?.AreaType?._value === 3,
                  message: '请选择所属区县',
                },
              ]}
              trigger="onConfirm"
              onClick={(e, pickerRef: RefObject<PickerRef>) => {
                pickerRef.current?.open();
              }}
            >
              <Picker
                onConfirm={val => {
                  setArea(val);
                  console.log('---val', val);
                  // form.setFieldsValue({
                  //   Street: null,
                  // });
                }}
                columns={[changePickerData(areaRenderList)]}
              >
                {items => {
                  return (
                    <Space align="center">
                      {items.every(item => item === null) ? (
                        <span className={styles.placeholder}>请选择</span>
                      ) : (
                        items.map(item => item?.label ?? '未选择').join(' - ')
                      )}
                    </Space>
                  );
                }}
              </Picker>
            </Form.Item>

            <Form.Item
              className={styles.formItem}
              name="Street"
              label={<div className={styles.label}>所属街道/园区</div>}
              rules={[
                {
                  required: policyInfo?.AreaType?._value === 4,
                  message: '请选择所所属街道',
                },
              ]}
              trigger="onConfirm"
              onClick={(e, pickerRef: RefObject<PickerRef>) => {
                pickerRef.current?.open();
              }}
            >
              <Picker columns={[changePickerData(streetRenderList)]}>
                {items => {
                  return (
                    <Space align="center">
                      {items.every(item => item === null) ? (
                        <span className={styles.placeholder}>请选择</span>
                      ) : (
                        items.map(item => item?.label ?? '未选择').join(' - ')
                      )}
                    </Space>
                  );
                }}
              </Picker>
            </Form.Item>

            <Form.Item
              name="AttachProof"
              label={<div className={styles.label}>营业执照</div>}
            >
              <UploadImage />
            </Form.Item>
          </FormBox>
        </Form>
        <FormRender
          className={styles.form}
          displayType="row"
          removeHiddenData={false}
          // schema={demoSchema}
          schema={renderSchema}
          form={autoForm}
          widgets={{
            formBox: FormBox,
            Link: MyLink,
            IOInvokerUpload,
            MyNumber,
            MyCheckBoxSingle,
            MySelect,
            MyCheckBoxMultiple,
          }}
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
            console.log('---form', autoForm.getFieldsValue(true));
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
