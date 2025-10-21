import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaInfoCircle, FaCheck, FaPlus, FaTimes } from 'react-icons/fa';
import "./UpdateElevatorForm.css";

// 1. Định nghĩa Schema (các quy tắc validation)
// Schema cho một tầng
const floorSchema = yup.object().shape({
  floor: yup.number().typeError('Floor must be a number').required('Required'),
  map: yup.string().required('Required'),
  positionInElevator: yup.string().required('Required'),
  positionInFront: yup.string().required('Required'),
  entryMission: yup.string().required('Required'),
  exitMission: yup.string().required('Required'),
  door: yup.string().required('Required'),
});

// Schema tổng thể
const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  ip: yup.string().required('IP is required').matches(/(\d{1,3}\.){3}\d{1,3}/, 'Invalid IP format'),
  turnInPlace: yup.string().required(),
  active: yup.string().required(),
  floors: yup.array().of(floorSchema) // Mảng chứa các object floor
    .min(1, 'At least one floor is required'), // Phải có ít nhất 1 tầng
});

// Giá trị mặc định cho một hàng tầng mới
const defaultFloor = {
  floor: 1,
  map: 'Map 1',
  positionInElevator: 'Pos A',
  positionInFront: 'Pos B',
  entryMission: 'Entry',
  exitMission: 'Exit',
  door: 'Door 1',
};

const UpdateElevatorForm = () => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: 'Elevator',
      ip: '192.168.30.21',
      turnInPlace: 'No',
      active: 'Yes',
      floors: [defaultFloor], // Khởi tạo với 1 tầng
    },
  });

  // 2. Khởi tạo useFieldArray
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'floors',
  });

  const onFormSubmit = (data) => {
    alert('Form is valid!\n' + JSON.stringify(data, null, 2));
    console.log("Form update: ", data)
  };

  return (
    <form className="update-elevator-form" onSubmit={handleSubmit(onFormSubmit)}>
      {/* --- Phần Form Cơ Bản --- */}
      <div className="form-group">
        <label htmlFor="name">Name <FaInfoCircle size={12} /></label>
        <input type="text" id="name" {...register("name")} className={`form-input ${errors.name ? 'input-error' : ''}`} />
        {errors.name && <span className="error-message">{errors.name.message}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="ip">IP address <FaInfoCircle size={12} /></label>
        <input type="text" id="ip" {...register("ip")} className={`form-input ${errors.ip ? 'input-error' : ''}`} />
        {errors.ip && <span className="error-message">{errors.ip.message}</span>}
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="turnInPlace">Turn in place <FaInfoCircle size={12} /></label>
          <select id="turnInPlace" {...register("turnInPlace")} className="form-select">
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="active">Active <FaInfoCircle size={12} /></label>
          <select id="active" {...register("active")} className="form-select">
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>

      {/* --- Phần Danh Sách Tầng (Field Array) --- */}
      <div className="floor-header">
        <label>Floor <FaInfoCircle size={12} /></label>
        <label>Map <FaInfoCircle size={12} /></label>
        <label>Position In The El... <FaInfoCircle size={12} /></label>
        <label>Position In Front... <FaInfoCircle size={12} /></label>
        <label>Entry Mission <FaInfoCircle size={12} /></label>
        <label>Exit Mission <FaInfoCircle size={12} /></label>
        <label>Door <FaInfoCircle size={12} /></label>
        <span></span>
      </div>

      {/* 3. Lặp qua `fields` từ useFieldArray */}
      {fields.map((item, index) => (
        <div className="floor-row" key={item.id}>
          {/* Rất quan trọng: Dùng `floors.${index}.fieldName`
            Và `register` chứ không phải `defaultValue`
          */}
          <input
            type="number"
            {...register(`floors.${index}.floor`)}
            className={`form-input ${errors.floors?.[index]?.floor ? 'input-error' : ''}`}
          />
          <select {...register(`floors.${index}.map`)} className="form-select">
            <option value="Map 1">Map 1</option><option value="Map 2">Map 2</option>
          </select>
          <select {...register(`floors.${index}.positionInElevator`)} className="form-select">
             <option value="Pos A">Pos A</option><option value="Pos B">Pos B</option>
          </select>
          <select {...register(`floors.${index}.positionInFront`)} className="form-select">
            <option value="Pos B">Pos B</option><option value="Pos A">Pos A</option>
          </select>
          <select {...register(`floors.${index}.entryMission`)} className="form-select">
            <option value="Entry">Entry</option><option value="Other">Other</option>
          </select>
          <select {...register(`floors.${index}.exitMission`)} className="form-select">
            <option value="Exit">Exit</option><option value="Other">Other</option>
          </select>
          <select {...register(`floors.${index}.door`)} className="form-select">
            <option value="Door 1">Door 1</option><option value="Door 2">Door 2</option>
          </select>
          <button type="button" className="delete-row-btn" onClick={() => remove(index)}>
            <FaTimes />
          </button>
        </div>
      ))}
      {/* Hiển thị lỗi nếu mảng rỗng */}
      {errors.floors && !errors.floors.length && <span className="error-message">{errors.floors.message}</span>}

      {/* 4. Nút để thêm một hàng mới */}
      <button type="button" className="add-floor-btn" onClick={() => append(defaultFloor)}>
        <FaPlus size={12} /> Add floor
      </button>

      {/* Nút Submit cuối cùng */}
      <button type="submit" className="update-btn">
        <FaCheck />
        Update elevator
      </button>
    </form>
  );
};

export default UpdateElevatorForm;