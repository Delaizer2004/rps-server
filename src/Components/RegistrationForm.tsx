import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import '../styles/registration.module.css'; // Імпортуємо стилі

type FormData = {
  playerName: string;
};

const RegistrationForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const navigate = useNavigate();

  const onSubmit = (data: FormData) => {
    localStorage.setItem('rps-player-name', data.playerName);
    navigate('/lobby'); // Перенаправлення в лобі після реєстрації
  };

  return (
    <div className="registration-container">
      <h2>Реєстрація гравця</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Ім'я гравця*</label>
          <input
            {...register('playerName', { 
              required: "Це поле обов'язкове",
              minLength: {
                value: 3,
                message: "Мінімум 3 символи"
              }
            })}
            placeholder="Введіть ваше ім'я"
          />
          {errors.playerName && (
            <p className="error">{errors.playerName.message}</p>
          )}
        </div>

        <button type="submit" className="submit-btn">
          Почати гру
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;