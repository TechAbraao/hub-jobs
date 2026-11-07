import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  useWindowDimensions,
  View,
  Platform,
} from 'react-native';

import Welcome from './src/screens/Welcome';
import Home from './src/screens/Home';
import Filters from './src/screens/Filters';
import JobDetails from './src/screens/JobDetails';
import Favorites from './src/screens/Favorites';
import AdminJobs from './src/screens/AdminJobs';

import {
  addFavoriteJob,
  listFavoriteJobs,
  listJobs,
  loginUser,
  registerUser,
  removeFavoriteJob,
  updateUserProfile,
} from './src/services/jobsApi';

function normalizeJob(job) {
  const title = job?.title || job?.cargo || 'N/A';
  const company = job?.company || job?.empresa || 'N/A';
  const location = job?.location || job?.local || 'N/A';
  const modality = job?.modality || job?.modalidade || 'N/A';
  const category = job?.category || job?.categoria || 'N/A';
  const contract = job?.contract || job?.contrato || 'N/A';
  const level = job?.level || job?.nivel || 'N/A';

  return {
    id: String(job?.id ?? `${company}-${title}`),
    cargo: title,
    empresa: company,
    local: location,
    modalidade: modality,
    categoria: category,
    contrato: contract,
    nivel: level,
    salario: job?.salary ?? job?.salario ?? 'N/A',
    tempo: job?.tempo || 'N/A',
    descricao: job?.description || job?.descricao || 'N/A',
    requisitos: Array.isArray(job?.requirements) && job.requirements.length > 0
      ? job.requirements
      : Array.isArray(job?.requisitos) && job.requisitos.length > 0
        ? job.requisitos
        : ['N/A'],
    beneficios: job?.benefits || job?.beneficios || 'N/A',
    link: job?.url || job?.link || '',
    company: job?.company || company,
    title: job?.title || title,
    location: job?.location || location,
    description: job?.description || job?.descricao || 'N/A',
    platform: job?.platform || 'N/A',
    salary: job?.salary ?? job?.salario ?? null,
  };
}

function normalizeJobs(jobs) {
  return (Array.isArray(jobs) ? jobs : []).map(normalizeJob);
}

export default function App() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [tela, setTela] = useState('Welcome');
  const [vagas, setVagas] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [vagaSelecionada, setVagaSelecionada] = useState(null);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 10,
    pages: 0,
  });

  const [filtros, setFiltros] = useState({
    modalidade: '',
    localizacao: '',
    contrato: '',
    nivel: '',
    data: '',
  });

  useEffect(() => {
    if (session) {
      setProfileDraft(session.username || '');
      setProfileCurrentPassword('');
      setProfileNewPassword('');
      setProfileError('');
      setProfileSuccess('');
      pesquisarNaGupy();
    }
  }, [session]);

  async function carregarFavoritos(username, role = session?.role) {
    if (!username || role === 'admin') {
      setFavoritos([]);
      return;
    }

    try {
      const favoriteJobs = await listFavoriteJobs(username);
      setFavoritos(normalizeJobs(favoriteJobs));
    } catch (error) {
      console.warn('Não foi possível carregar favoritos:', error.message);
      setFavoritos([]);
    }
  }

  async function handleAuth({ username, password, mode = 'login' }) {
    const trimmedUsername = (username || '').trim();

    if (!trimmedUsername || !(password || '').trim()) {
      setAuthError('Informe usuário e senha para continuar.');
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError('');

      const response = mode === 'register'
        ? await registerUser({ username: trimmedUsername, password, role: 'user' })
        : await loginUser({ username: trimmedUsername, password });

      const user = response?.user ?? response;
      const nextSession = {
        username: user.username,
        role: user.role || 'user',
        user,
      };

      setSession(nextSession);
      await carregarFavoritos(user.username, nextSession.role);
      setTela('Home');
    } catch (error) {
      setAuthError(error.message || 'Não foi possível autenticar o usuário.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function pesquisarNaGupy(termo = busca, pagina = 1, filtrosAtuais = filtros) {
    if (!session) {
      return;
    }

    try {
      const params = {
        page: pagina,
        per_page: 10,
        q: termo || undefined,
      };

      if (filtrosAtuais?.localizacao) {
        params.location = filtrosAtuais.localizacao;
      }

      const response = await listJobs(params);
      const jobs = normalizeJobs(response.jobs || []);
      setVagas(jobs);
      setPaginaAtual(Number(response?.pagination?.page || pagina));
      setPagination(response?.pagination || {
        total: jobs.length,
        page: pagina,
        per_page: 10,
        pages: 1,
      });
    } catch (error) {
      console.log('Erro na busca:', error.message);
      setVagas([]);
      setPagination({ total: 0, page: 1, per_page: 10, pages: 0 });
      setPaginaAtual(1);
    }
  }

  async function alternarFavorito(vaga) {
    if (session?.role === 'admin' || !session?.username || !vaga?.id) {
      return;
    }

    const jaFavorita = favoritos.some(item => item.id === vaga.id);

    try {
      if (jaFavorita) {
        await removeFavoriteJob(session.username, vaga.id);
        setFavoritos(atual => atual.filter(item => item.id !== vaga.id));
        return;
      }

      await addFavoriteJob(session.username, vaga.id);
      setFavoritos(atual => {
        if (atual.some(item => item.id === vaga.id)) {
          return atual;
        }
        return [...atual, normalizeJob(vaga)];
      });
    } catch (error) {
      console.warn('Não foi possível atualizar favorito:', error.message);
    }
  }

  function ehFavorita(vaga) {
    return favoritos.some(item => item.id === vaga.id);
  }

  function abrirDetalhes(vaga) {
    setVagaSelecionada(vaga);
    setTela('JobDetails');
  }

  function voltarParaHome() {
    setTela('Home');
  }

  function abrirAdmin() {
    setTela('AdminJobs');
  }

  async function handleProfileSave() {
    const trimmedUsername = (profileDraft || '').trim();
    const trimmedCurrentPassword = (profileCurrentPassword || '').trim();
    const trimmedNewPassword = (profileNewPassword || '').trim();

    if (!session?.user?.id) {
      setProfileError('Sessão inválida. Faça login novamente.');
      return;
    }

    if (!trimmedUsername && !trimmedNewPassword) {
      setProfileError('Informe um novo nome de usuário ou uma nova senha.');
      return;
    }

    if (trimmedNewPassword && trimmedCurrentPassword.length < 3) {
      setProfileError('Informe a senha atual para alterar a senha.');
      return;
    }

    try {
      const updatedUser = await updateUserProfile(session.user.id, {
        username: trimmedUsername || undefined,
        current_username: trimmedUsername ? session.username : undefined,
        password: trimmedNewPassword || undefined,
        current_password: trimmedNewPassword ? trimmedCurrentPassword : undefined,
      });

      const successMessage = trimmedNewPassword && trimmedUsername
        ? 'Nome de usuário e senha atualizados com sucesso.'
        : trimmedNewPassword
          ? 'Senha atualizada com sucesso.'
          : 'Nome de usuário atualizado com sucesso.';

      setSession(prev => ({
        ...prev,
        username: updatedUser.username,
        user: updatedUser,
      }));
      await carregarFavoritos(updatedUser.username, session.role);
      setProfileCurrentPassword('');
      setProfileNewPassword('');
      setProfileError('');
      setProfileSuccess(successMessage);
      setEditingProfile(false);
      Alert.alert('Perfil', successMessage);
    } catch (error) {
      const message = error.message || 'Não foi possível atualizar o perfil.';
      setProfileError(message);
      Alert.alert('Perfil', message);
    }
  }

  function handleLogout() {
    setSession(null);
    setAuthError('');
    setTela('Welcome');
    setVagas([]);
    setFavoritos([]);
    setVagaSelecionada(null);
    setEditingProfile(false);
    setProfileDraft('');
    setProfileCurrentPassword('');
    setProfileNewPassword('');
    setProfileError('');
    setProfileSuccess('');
  }

  function renderizarTela() {
    if (!session) {
      return (
        <Welcome
          onLogin={handleAuth}
          onRegister={handleAuth}
          loading={authLoading}
          error={authError}
        />
      );
    }

    const canManageFavorites = session.role !== 'admin';

    switch (tela) {
      case 'Home':
        return (
          <Home
            vagas={vagas}
            busca={busca}
            setBusca={setBusca}
            categoria={categoria}
            setCategoria={setCategoria}
            favoritos={favoritos}
            ehFavorita={ehFavorita}
            alternarFavorito={canManageFavorites ? alternarFavorito : () => {}}
            abrirDetalhes={abrirDetalhes}
            abrirFiltros={() => setTela('Filters')}
            abrirFavoritos={canManageFavorites ? () => setTela('Favorites') : undefined}
            onOpenAdmin={session.role === 'admin' ? abrirAdmin : null}
            pesquisarNaGupy={pesquisarNaGupy}
            filtros={filtros}
            session={session}
            onLogout={handleLogout}
            editingProfile={editingProfile}
            setEditingProfile={setEditingProfile}
            profileDraft={profileDraft}
            setProfileDraft={setProfileDraft}
            profileCurrentPassword={profileCurrentPassword}
            setProfileCurrentPassword={setProfileCurrentPassword}
            profileNewPassword={profileNewPassword}
            setProfileNewPassword={setProfileNewPassword}
            profileError={profileError}
            profileSuccess={profileSuccess}
            onSaveProfile={handleProfileSave}
            paginaAtual={paginaAtual}
            pagination={pagination}
            onPageChange={pagina => pesquisarNaGupy(busca, pagina, filtros)}
          />
        );

      case 'Filters':
        return (
          <Filters
            filtros={filtros}
            onBack={voltarParaHome}
            onApply={novosFiltros => {
              setFiltros(novosFiltros);
              setPaginaAtual(1);
              setTela('Home');
              pesquisarNaGupy(busca, 1, novosFiltros);
            }}
          />
        );

      case 'JobDetails':
        return vagaSelecionada ? (
          <JobDetails
            vaga={vagaSelecionada}
            favorita={canManageFavorites ? ehFavorita(vagaSelecionada) : false}
            onFavorite={canManageFavorites ? () => alternarFavorito(vagaSelecionada) : undefined}
            onBack={voltarParaHome}
          />
        ) : null;

      case 'Favorites':
        if (!canManageFavorites) {
          return (
            <Home
              vagas={vagas}
              busca={busca}
              setBusca={setBusca}
              categoria={categoria}
              setCategoria={setCategoria}
              favoritos={favoritos}
              ehFavorita={ehFavorita}
              alternarFavorito={() => {}}
              abrirDetalhes={abrirDetalhes}
              abrirFiltros={() => setTela('Filters')}
              abrirFavoritos={undefined}
              onOpenAdmin={session.role === 'admin' ? abrirAdmin : null}
              pesquisarNaGupy={pesquisarNaGupy}
              filtros={filtros}
              session={session}
              onLogout={handleLogout}
              paginaAtual={paginaAtual}
              pagination={pagination}
              onPageChange={pagina => pesquisarNaGupy(busca, pagina, filtros)}
            />
          );
        }

        return (
          <Favorites
            vagas={favoritos}
            ehFavorita={ehFavorita}
            alternarFavorito={alternarFavorito}
            abrirDetalhes={abrirDetalhes}
            voltar={voltarParaHome}
          />
        );

      case 'AdminJobs':
        return session.role === 'admin' ? (
          <AdminJobs onBack={voltarParaHome} />
        ) : (
          <Home
            vagas={vagas}
            busca={busca}
            setBusca={setBusca}
            categoria={categoria}
            setCategoria={setCategoria}
            favoritos={favoritos}
            ehFavorita={ehFavorita}
            alternarFavorito={canManageFavorites ? alternarFavorito : () => {}}
            abrirDetalhes={abrirDetalhes}
            abrirFiltros={() => setTela('Filters')}
            abrirFavoritos={canManageFavorites ? () => setTela('Favorites') : undefined}
            onOpenAdmin={null}
            pesquisarNaGupy={pesquisarNaGupy}
            filtros={filtros}
            session={session}
            onLogout={handleLogout}
          />
        );

      default:
        return (
          <Welcome
            onLogin={handleAuth}
            onRegister={handleAuth}
            loading={authLoading}
            error={authError}
          />
        );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View
        style={[
          styles.content,
          isTablet && styles.tabletContent,
        ]}
      >
        {renderizarTela()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },

  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },

  tabletContent: {
    maxWidth: 900,
  },
});
