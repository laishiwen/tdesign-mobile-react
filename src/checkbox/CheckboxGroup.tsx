import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import isNumber from 'lodash/isNumber';
import classNames from 'classnames';
import { CheckboxOption, CheckboxOptionObj, TdCheckboxGroupProps } from './type';
import { StyledProps } from '../common';
import useConfig from '../_util/useConfig';
import useDefault from '../_util/useDefault';
import Checkbox, { CheckContext, CheckContextValue } from './Checkbox';

export interface CheckboxGroupProps extends TdCheckboxGroupProps, StyledProps {
  children?: React.ReactNode;
}

// 将 checkBox 的 value 转换为 string|number
const getCheckboxValue = (v: CheckboxOption): string | number => {
  switch (typeof v) {
    case 'number' || 'string':
      return v as string | number;
    case 'object': {
      const vs = v as CheckboxOptionObj;
      return vs.value;
    }
    default:
      return undefined;
  }
};

export function CheckboxGroup(props: CheckboxGroupProps) {
  const { classPrefix } = useConfig();
  const { 
    value, 
    defaultValue, 
    disabled, 
    className, 
    max, 
    options = [], 
    name,
    style,
    children, 
    onChange, 
  } = props;

  const internalOptions =
    Array.isArray(options) && options.length > 0
      ? options
      : React.Children.map(children, (child) => (child as ReactElement).props);
  const optionsWithoutCheckAll = internalOptions.filter((t) => typeof t !== 'object' || !t.checkAll);
  const optionsWithoutCheckAllValues = [];
  optionsWithoutCheckAll.forEach((v) => {
    const vs = getCheckboxValue(v);
    optionsWithoutCheckAllValues.push(vs);
  });

  const [internalValue, setInternalValue] = useDefault(value, defaultValue, onChange);
  const [localMax, setLocalMax] = useState(max);

  const checkedSet = useMemo(() => {
    if (!Array.isArray(internalValue)) return new Set([]);
    return new Set([].concat(internalValue));
  }, [internalValue]);

  // 用于决定全选状态的属性
  const indeterminate = useMemo(() => {
    const list = Array.from(checkedSet);
    return list.length !== 0 && list.length !== optionsWithoutCheckAll.length;
  }, [checkedSet, optionsWithoutCheckAll]);

  const checkAllChecked = useMemo(() => {
    const list = Array.from(checkedSet);
    return list.length === optionsWithoutCheckAll.length;
  }, [checkedSet, optionsWithoutCheckAll]);

  useEffect(() => {
    if (!isNumber(max)) return;
    if (max < checkedSet.size) {
      console.warn('[TDesign] max should be less than the length of value, change is invalid');
    } else {
      setLocalMax(max);
    }
  }, [max, checkedSet]);

  const context: CheckContextValue = {
    inject: (checkProps) => {
      // 如果已经受控，则不注入
      if (typeof checkProps.checked !== 'undefined') {
        return checkProps;
      }

      const { value: checkValue } = checkProps;

      return {
        ...checkProps,
        name,
        checked: checkProps.checkAll ? checkAllChecked : checkedSet.has(checkValue),
        indeterminate: checkProps.checkAll ? indeterminate : checkProps.indeterminate,
        disabled: checkProps.disabled || disabled || (checkedSet.size >= localMax && !checkedSet.has(checkValue)),
        onChange(checked, { e }) {
          if (typeof checkProps.onChange === 'function') {
            checkProps.onChange(checked, { e });
          }

          // 全选时的逻辑处理
          if (checkProps.checkAll) {
            checkedSet.clear();
            if (checked) {
              optionsWithoutCheckAllValues.forEach((v) => {
                checkedSet.add(v);
              });
            }
          } else if (checked) {
            if (checkedSet.size >= localMax && isNumber(max)) return;
            checkedSet.add(checkValue);
          } else {
            checkedSet.delete(checkValue);
          }

          setInternalValue(Array.from(checkedSet), { e });
        },
      };
    },
  };

  // options 和 children 的抉择,在未明确说明时，暂时以 options 优先
  const useOptions = Array.isArray(options) && options.length !== 0;

  return (
    <div className={classNames(`${classPrefix}-checkbox-group`, className)} style={style}>
      <div className={`${classPrefix}-cell-group`}>
        <div className={`${classPrefix}cell-group__container`}>
          <CheckContext.Provider value={context}>
            {useOptions
              ? options.map((v, index) => {
                const type = typeof v;
                switch (type) {
                  case 'number' || 'string': {
                    const vs = v as number | string;
                    return (
                      <Checkbox key={vs} label={vs} value={vs}>
                        {v}
                      </Checkbox>
                    );
                  }
                  case 'object': {
                    const vs = v as CheckboxOptionObj;
                    // CheckAll 的 checkBox 不存在 value,故用 checkAll_index 来保证尽量不和用户的 value 冲突.
                    return vs.checkAll ? (
                      <Checkbox {...v} key={`checkAll_${index}`} indeterminate={indeterminate} />
                    ) : (
                      <Checkbox {...v} key={vs.value} disabled={vs.disabled || disabled} />
                    );
                  }
                  default:
                    return null;
                }
              })
              : children}
          </CheckContext.Provider>
        </div>
      </div>
    </div>
  )
}
export default CheckboxGroup;
