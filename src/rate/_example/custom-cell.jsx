import React from 'react';
import './style/customCell.less';

export default function CustomCell(props) {
  return (
    <div
      className="custom-cell"
      style={{
        backgroundColor: props.title ? '#fff' : null,
        marginBottom: props.showBottom ? '16px' : null,
      }}
    >
      <div style={{ width: props.title ? '80px' : null, marginRight: '16px' }}>{props.title}</div>
      {props.children}
    </div>
  );
}
