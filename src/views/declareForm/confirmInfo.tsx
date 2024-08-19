import { ApplyPeriodType } from '@CodeDefine/customer/ApplyPeriodType';
import { AreaViewRO } from '@CodeDefine/customer/AreaViewRO';
import { CustomerPolicyDetailRO } from '@CodeDefine/customer/CustomerPolicyDetailRO';
import { Button, Form, Input, Picker, PickerRef, Toast } from 'antd-mobile';
import { DownOutline, UpOutline } from 'antd-mobile-icons';
import classNames from 'classnames';
import { filter, isEmpty, map } from 'lodash-es';
import moment from 'moment';
import React, { RefObject, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import ImgIndexBg from '@/assets/policyDetail/bg.png';
import policyStatusIcon from '@/assets/policyDetail/policyStatus.png';
import { IsJsonString } from '@/views/declareForm/commonTools';
import UploadImage from '@/views/declareForm/components/Upload';
import useDeclareForm from '@/views/declareForm/useDeclareForm';

import styles from './index.module.scss';

export default function ConfirmInfo() {
  const { id: bodyId } = useParams();
  const [searchParams] = useSearchParams();
  const _policyId = searchParams.get('policyId');
  const _draftId = searchParams.get('draftId') || '-1';
  const [draftId, setDraftId] = useState(_draftId);

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
  const LoginScriptValue = JSON.parse(
    localStorage.getItem('LoginScriptValue') || null,
  );

  const [form] = Form.useForm();

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
  } = useDeclareForm();

  useEffect(() => {
    // 获取政策信息
    getPolicyInfo(bodyId);
    // 政策类型
    getAllPolicyType();
    // 区域信息
    getAreaDict();
  }, [bodyId]);

  const getApplyFormConfigDetail = async (
    policyInfo: CustomerPolicyDetailRO,
  ) => {
    //  获取草稿
    const msg: any = await getDraftDetail(bodyId, draftId);
    setDraftId(msg.draftid);
    //   getApplyVersionCodeRange 获取时间周期
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
      //   一次性
      setCycleList([]);
    } else {
      const currentDateIndex = resultCircle.length - rightCount - 1;
      if (msg.draftid === '0') {
        setVersionCode(resultCircle[currentDateIndex]);
      } else {
        setVersionCode(msg.versioncode);
      }

      setCycleList(
        map(resultCircle, item => {
          return { label: item, value: item };
        }),
      );
    }

    if (
      msg?.draftid !== '0' &&
      msg?.attachProof &&
      IsJsonString(msg?.attachProof)
    ) {
      const fileBusiness = JSON.parse(msg.attachProof)[0];
      if (!fileBusiness) return;

      form.setFieldsValue({
        AttachProof: fileBusiness,
      });
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
  };

  /**
   * 获取申报信息
   * @param policyInfo
   */
  const getApplyTargetInfo = async (policyInfo: CustomerPolicyDetailRO) => {
    const result = await getLatestApplyTargetInfo();
    const { AttachProof, AreaId, StreetAreaId, CityAreaId } = result;

    form.setFieldsValue({
      City: CityAreaId === '0' ? undefined : CityAreaId,
      AreaID: AreaId === '0' ? undefined : AreaId,
      Street: StreetAreaId === '0' ? undefined : StreetAreaId,
    });

    // 营业执照
    if (AttachProof) {
      const fileBusiness = JSON.parse(AttachProof)[0];
      form.setFieldValue('AttachProof', AttachProof);

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

    getApplyFormConfigDetail(policyInfo);
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
      form.setFieldsValue({
        City: item.ID,
      });
      setCity(item.ID);
    }
    if (item.Type._value === 3) {
      form.setFieldsValue({
        AreaID: item.ID,
      });
      setArea(item.ID);
    }
    if (item.Type._value === 4) {
      form.setFieldsValue({
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
    form.validateFields().then(values => {
      Toast.show({
        content: '保存成功',
      });
    });
  };

  const handleSubmit = () => {
    // form.validateFields().then(values => {
    //   Toast.show({
    //     content: '保存成功',
    //   });
    // });
  };

  useEffect(() => {
    if (isEmpty(policyInfo)) return;

    /**
     * 个人账号，不需要走获取营业执照
     */
    const LoginScriptValue = JSON.parse(
      localStorage.getItem('LoginScriptValue') || '{}',
    );
    // 企业账号渲染
    if (LoginScriptValue?.LoginType === 1) {
      getApplyTargetInfo(policyInfo);
    } else {
      // 个人账号渲染
      getApplyFormConfigDetail(policyInfo);
    }

    //   获取表单
  }, [policyInfo]);

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
          form={form}
          // onFinish={onSubmitCallback}
          // onFinishFailed={({ values, errorFields, outOfDate }) => {
          //   console.log(values, errorFields, outOfDate);
          //   Modal.alert({
          //     content: renderErrors(errorFields),
          //     closeOnMaskClick: true,
          //   });
          // }}
        >
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
          <div className={styles.card}>
            <div className={styles.head}>
              <div className={styles.left}>申报对象情况</div>
              <div className={styles.right}>
                <span className={styles.btn} onClick={() => {}}>
                  收起
                  <UpOutline />
                  <DownOutline />
                </span>
              </div>
            </div>
            <div className={styles.body} ref={() => {}}>
              {policyInfo?.ApplySource?._value === 2 ? (
                <Form.Item
                  name="CompanyName"
                  label={<div className={styles.label}>申报企业名称</div>}
                  rules={[{ required: true, message: '必填项' }]}
                  initialValue={LoginScriptValue?.CompanyName}
                >
                  <Input onChange={console.log} placeholder="请输入" />
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
                <Input onChange={console.log} placeholder="请输入" />
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
                <Input onChange={console.log} placeholder="请输入" />
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
                <Input onChange={console.log} placeholder="请输入" />
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
                  {/* {items => { */}
                  {/*  console.log('---items', items); */}
                  {/*  return ( */}
                  {/*    <Space align="center"> */}
                  {/*      {items.every(item => item === null) */}
                  {/*        ? '请选择' */}
                  {/*        : items */}
                  {/*            .map(item => item?.label ?? '未选择') */}
                  {/*            .join(' - ')} */}
                  {/*    </Space> */}
                  {/*  ); */}
                  {/* }} */}
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
                  {/* {items => { */}
                  {/*  return ( */}
                  {/*    <Space align="center"> */}
                  {/*      {items.every(item => item === null) */}
                  {/*        ? '请选择' */}
                  {/*        : items */}
                  {/*            .map(item => item?.label ?? '未选择') */}
                  {/*            .join(' - ')} */}
                  {/*    </Space> */}
                  {/*  ); */}
                  {/* }} */}
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
                  {/* {items => { */}
                  {/*  console.log('---items', items); */}
                  {/*  return ( */}
                  {/*    <Space align="center"> */}
                  {/*      {items.every(item => item === null) */}
                  {/*        ? '请选择' */}
                  {/*        : items */}
                  {/*            .map(item => item?.label ?? '未选择') */}
                  {/*            .join(' - ')} */}
                  {/*    </Space> */}
                  {/*  ); */}
                  {/* }} */}
                </Picker>
              </Form.Item>

              <Form.Item
                name="AttachProof"
                label={<div className={styles.label}>营业执照</div>}
              >
                <UploadImage
                  maxCount={5}
                  fileSize={5}
                  memo="若营业执照内容有变更，请在此重新上传；支持扩展名：pdf、jepg、jpg、png，单文件5M内大小"
                />
                <div>描述信息</div>
              </Form.Item>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.head}>
              <div className={styles.left}>收益对象</div>
              <div className={styles.right}>
                <span className={styles.btn} onClick={() => {}}>
                  收起
                  <UpOutline />
                  <DownOutline />
                </span>
              </div>
            </div>
            <div className={styles.body}>
              <Form.Item
                name="1122"
                label={<div className={styles.label}>收益企业名称</div>}
                rules={[{ required: true, message: '必填项' }]}
              >
                <Input onChange={console.log} placeholder="请输入" />
              </Form.Item>
            </div>
          </div>
        </Form>
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
            handleSubmit();
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
