import React, { Component } from 'react';
import { Icon, Checkbox } from 'antd';
import classNames from 'classnames';

import styles from './CustomSelect.less';


export default class CustomSelect extends Component {
  constructor(props) {
    super(props);
    this.textInput = null;
    this.state = {
      focus: false,
      checkedList: [],
      // options: props.options,
      // checkedList: defaultCheckedList,
      indeterminate: true,
      checkAll: false,
    };

    this.setTextInputRef = (element) => {
      this.textInput = element;
    };
    this.focusTextInput = () => {
      if (this.textInput) { this.textInput.focus(); }
    };
  }
  onChange = (checkedList) => {
    console.log('1111------>>>>>>>222222');
    // console.log(checkedList, 'onchange checkList');
    this.setState({
      checkedList,
      indeterminate: !!checkedList.length && (checkedList.length < this.props.options.length),
      checkAll: checkedList.length === this.props.options.length,
    });
    // if (this.props.onSelectChange) {
    //   this.props.onSelectChange(checkedList);
    // }
    console.log('onchange function', checkedList);
    this.selectChange(checkedList);
  }

  onCheckAllChange = (e) => {
    // console.info(e.target.checked, 'onCheckAllChange e.target.checked');
    const checkList = e.target.checked ? this.props.options.map(_ => _.name) : [];
    this.setState({
      checkedList: checkList,
      indeterminate: false,
      checkAll: e.target.checked,
    });
    // if (this.props.onSelectChange) {
    //   this.props.onSelectChange(checkList);
    // }
    this.selectChange(checkList);
  }
  removeItem(name) {
    const currentCheckList = this.state.checkedList;
    const index = currentCheckList.findIndex(item => item === name);
    currentCheckList.splice(index, 1);
    this.setState({
      checkedList: currentCheckList,
      checkAll: false,
    });
    this.selectChange(currentCheckList);
    // console.info(this.state.checkedList, name, 'kevin', this);
    this.onChange(currentCheckList);
  }
  selectChange(checkedList) {
    if (this.props.onSelectChange) {
      this.props.onSelectChange(checkedList);
    }
  }
  blurEvent(e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    const target = e.currentTarget;
    setTimeout(() => {
      if (!target.contains(document.activeElement)) {
        this.setState({ focus: false });
      }
    }, 0);
  }
  focusEvent(e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    this.focusTextInput();
    this.setState({ focus: true });
  }
  render() {
    const options = this.props.options.map(
      _ => (
        <li
          key={_.name}
          className={this.state.checkedList.includes(_.name) ? styles.selectedItem : null}
        >
          <Checkbox
            checked={this.state.checkedList.includes(_.name)}
            key={_.name}
            value={_.name}
          >{_.name}
          </Checkbox>
        </li>
      )
    );
    return (
      <div
        // tabIndex="1"
        tabIndex="-1"
        // onFocus={this.focusEvent.bind(this)}
        // onBlur={this.blurEvent.bind(this)}
        onBlur={this.blurEvent.bind(this)}
        onClick={this.focusEvent.bind(this)}
        className={classNames(styles.customeSelect, this.state.focus ? styles.focused : null)}
      >
        <div className={styles.selectedWrapper}>
          <ul>
            {
              this.state.checkedList.map((item) => {
                return (
                  <li key={item} className={styles.selectedItem}>
                    <span>{item}</span>
                    <Icon className="pointer" onClick={this.removeItem.bind(this, item)} type="close" theme="outlined" />
                  </li>
                );
              })
            }
            <li className={styles.searchInputItem}>
              <input maxLength="0" type="text" ref={this.setTextInputRef} />
            </li>
          </ul>
        </div>
        <div className={styles.iconWrapper}>
          <Icon type="down" theme="outlined" />
        </div>

        <div className={classNames(styles.selectionItemWrapper, this.state.focus ? styles.focused : null)} style={{ position: 'absolute' }} >
          <ul>
            <li className={styles.selectedAllItem}>
              <Checkbox
                indeterminate={this.state.indeterminate}
                onChange={this.onCheckAllChange}
                checked={this.state.checkAll}
              >
              全选
              </Checkbox>
            </li>

            <Checkbox.Group
              style={{ width: '100%' }}
              value={this.state.checkedList}
              onChange={this.onChange.bind(this)}
            >
              {options}
            </Checkbox.Group>

            {/** 修改样式 */}
            {/* <Checkbox.Group
              options={this.props.options.map(_ => _.name)}
              style={{ width: '100%' }}
              value={this.state.checkedList}
              onChange={this.onChange.bind(this)}
            /> */}

          </ul>
        </div>
      </div>
    );
  }
}
