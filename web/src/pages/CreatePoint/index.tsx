import React, {useEffect, useState, ChangeEvent, FormEvent} from 'react';
import './styles.css';
import Logo from '../../assets/logo.svg'
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent} from 'leaflet';
import axios from 'axios';
import api from '../../services/api';
import Dropzone from '../../components/Dropzone';

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
  nome: string;
}


interface IBGECityResponse {
  id: number;
  nome: string;
}



const CreatePoint = () =>  {
  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<IBGEUFResponse[]>([]);
  const [cities, setCities] = useState<IBGECityResponse[]>([]);

  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  });

  const [selectedUf, setSelectedUf] = useState('0');
  const [selectedCity, setSelectedCity] = useState('0');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
  const [selectedFile, setSelectedFile] = useState<File>();

  const history = useHistory();

  useEffect( () => {
    navigator.geolocation.getCurrentPosition(position =>{
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    })
  }, []);

  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data);
    })
  }, []);

  useEffect( () => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(response => {
      const ufs = response.data.map(uf => {
        return {
          sigla: uf.sigla,
          nome: uf.nome
        }
      });
      setUfs(ufs);
    });
  }, []);

  useEffect( () =>  {
      if(selectedUf === '0'){
        return;
      }

      axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then(response => {
        const cities = response.data.map(city => {
          return {
            id: city.id,
            nome: city.nome
          }
        });
        setCities(cities);
      });

  }, [selectedUf]);

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;
    setSelectedUf(uf);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;
    setSelectedCity(city);
  }

  function handleMapClick(event: LeafletMouseEvent){
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng
    ]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>){
    const {name, value} = event.target;
    setFormData({...formData, [name]: value})
  }

  function handleSelectItem(id: number ){
    const alreadySelected =  selectedItems.findIndex(item => item === id);
    if(alreadySelected >= 0){
      const filteredItems = selectedItems.filter(item => item !== id);
        setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }

  }

  async function handleSubmit(event: FormEvent){
    event.preventDefault();

    const {name, email, whatsapp} = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;

    const data = new FormData();

      data.append('name', name);
      data.append('email', email);
      data.append('whatsapp', whatsapp);
      data.append('uf', uf);
      data.append('city', city);
      data.append('latitude',  String(latitude));
      data.append('longitude', String(longitude));
      data.append('items', items.join(','));

      if(selectedFile){    
        data.append('image', selectedFile);
      }

    await api.post('/points', data);

    alert('Ponto de coleta criado !');
    
    history.push('/');
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={Logo} alt="Ecoleta"/>

        <Link to="/">
          <FiArrowLeft/>
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br/> ponto de coleta </h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input onChange={handleInputChange} type="text" name="name" id="name"/>
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input onChange={handleInputChange} type="email" name="email" id="email"/>
            </div>

            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input onChange={handleInputChange} type="text" name="whatsapp" id="whatsapp"/>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

              <Marker position={selectedPosition}>
                      
              </Marker>
          </Map>


          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado</label>
              <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUf}>
                <option value="0">Selecione o estado</option>
                {ufs.map(uf => (
                  <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                <option value="0">Selecione uma cidade</option>
                {cities.map(citie => (
                  <option key={citie.id} value={citie.nome}>{citie.nome}</option>
                ))}
              </select>
            </div>
          </div>

        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítens de coleta</h2>
            <span>Selecione um os mais ítens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map(item => {
              return (
                <li 
                  key={item.id} 
                  onClick={ () => handleSelectItem(item.id)}
                  className={selectedItems.includes(item.id) ? 'selected': ''}
                >
                  <img src={item.image_url} alt={item.title}/>
                  <span>{item.title}</span>
                </li>
              );
            })}
           

          </ul>
        </fieldset>

        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div>
  );
}

export default CreatePoint;