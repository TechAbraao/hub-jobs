import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import JobCard from '../components/JobCard';
import BottomTabs from '../components/BottomTabs';
import Chip from '../components/Chip';

const BLUE = '#1647C5';

export default function Home({
  // vagas da plataforma (backend)
  vagas,
  paginaAtual = 1,
  pagination = { total: 0, page: 1, per_page: 10, pages: 0 },
  onPageChange,
  pesquisarNaPlataforma,
  // vagas da Gupy (API da Gupy)
  vagasGupy = [],
  gupyCarregada = false,
  carregandoGupy = false,
  erroGupy = '',
  paginaGupy = 1,
  paginationGupy = { total: 0, page: 1, per_page: 10, pages: 0 },
  onPageChangeGupy,
  pesquisarNaGupy,
  // restante
  busca,
  setBusca,
  categoria,
  setCategoria,
  ehFavorita,
  alternarFavorito,
  abrirDetalhes,
  abrirFiltros,
  abrirFavoritos,
  onOpenAdmin,
  filtros,
  session,
  onLogout,
  editingProfile = false,
  setEditingProfile,
  profileDraft = '',
  setProfileDraft,
  profileCurrentPassword = '',
  setProfileCurrentPassword,
  profileNewPassword = '',
  setProfileNewPassword,
  profileError = '',
  setProfileError,
  profileSuccess = '',
  setProfileSuccess,
  onSaveProfile,
}) {
  const canManageFavorites = session?.role !== 'admin';
  const [activeScreen, setActiveScreen] = useState('plataforma'); // 'plataforma' | 'gupy'

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'HubJobs | Vagas';
    }
  }, []);

  // Ao abrir a aba da Gupy pela primeira vez, faz a requisição para a API da Gupy
  useEffect(() => {
    if (activeScreen === 'gupy' && !gupyCarregada && !carregandoGupy) {
      pesquisarNaGupy?.(busca);
    }
  }, [activeScreen]);

  // Vagas da plataforma: filtros aplicados no app (como já era)
  const vagasPlataforma = vagas.filter(vaga => {
    const termo = busca.toLowerCase();

    const correspondeBusca =
      vaga.cargo.toLowerCase().includes(termo) ||
      vaga.empresa.toLowerCase().includes(termo);

    const correspondeCategoria =
      categoria === 'Todas' || vaga.categoria === categoria;

    const correspondeModalidade =
      !filtros.modalidade || vaga.modalidade === filtros.modalidade;

    const correspondeLocal =
      !filtros.localizacao ||
      vaga.local.toLowerCase().includes(filtros.localizacao.toLowerCase()) ||
      vaga.local === 'Brasil';

    const correspondeContrato =
      !filtros.contrato || vaga.contrato === filtros.contrato;

    const correspondeNivel =
      !filtros.nivel || vaga.nivel === filtros.nivel;

    return (
      correspondeBusca &&
      correspondeCategoria &&
      correspondeModalidade &&
      correspondeLocal &&
      correspondeContrato &&
      correspondeNivel
    );
  });

  const buscar = () => {
    if (activeScreen === 'gupy') {
      pesquisarNaGupy?.(busca);
    } else {
      pesquisarNaPlataforma?.(busca);
    }
  };

  const renderPaginacao = (pag, pagina, onChange) => {
    if (!pag || pag.pages <= 1) return null;

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 4 }}>
        <TouchableOpacity
          onPress={() => onChange?.(Math.max(1, pagina - 1))}
          disabled={pagina <= 1 || !onChange}
          style={{
            flex: 1,
            backgroundColor: pagina <= 1 ? '#E7EBF4' : '#1647C5',
            paddingVertical: 10,
            borderRadius: 10,
            marginRight: 8,
          }}
        >
          <Text style={{ textAlign: 'center', color: pagina <= 1 ? '#7A8698' : '#FFFFFF', fontWeight: '700' }}>
            Anterior
          </Text>
        </TouchableOpacity>

        <Text style={{ alignSelf: 'center', color: '#364B73', fontSize: 12, fontWeight: '700' }}>
          Página {pagina} / {pag.pages}
        </Text>

        <TouchableOpacity
          onPress={() => onChange?.(Math.min(pag.pages, pagina + 1))}
          disabled={pagina >= pag.pages || !onChange}
          style={{
            flex: 1,
            backgroundColor: pagina >= pag.pages ? '#E7EBF4' : '#1647C5',
            paddingVertical: 10,
            borderRadius: 10,
            marginLeft: 8,
          }}
        >
          <Text style={{ textAlign: 'center', color: pagina >= pag.pages ? '#7A8698' : '#FFFFFF', fontWeight: '700' }}>
            Próxima
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPlataforma = () => (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
        {['Todas', 'Produto', 'Engenharia', 'Dados'].map(item => (
          <Chip
            key={item}
            label={item}
            selected={categoria === item}
            onPress={() => setCategoria(item)}
          />
        ))}
      </View>

      {vagasPlataforma.map(vaga => (
        <JobCard
          key={`plataforma-${vaga.id}`}
          vaga={vaga}
          favorita={canManageFavorites ? ehFavorita(vaga) : false}
          onPress={() => abrirDetalhes(vaga)}
          onFavorite={canManageFavorites ? () => alternarFavorito(vaga) : undefined}
        />
      ))}

      {vagasPlataforma.length === 0 && (
        <Text style={{ textAlign: 'center', color: '#8792A6', marginTop: 30 }}>
          Nenhuma vaga da plataforma com esses critérios.
        </Text>
      )}

      {renderPaginacao(pagination, paginaAtual, onPageChange)}
    </>
  );

  const renderGupy = () => (
    <>
      {/*
<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
  {['Todas', 'Desenvolvedor', 'Tecnologia', 'Dados'].map(item => (
    <Chip
      key={item}
      label={item}
      selected={categoria === item}
      onPress={() => None}
    />
  ))} 
</View>
  */}


      {carregandoGupy ? (
        <Text style={{ textAlign: 'center', color: '#8792A6', marginTop: 30 }}>
          Buscando vagas na Gupy...
        </Text>
      ) : erroGupy ? (
        <Text style={{ textAlign: 'center', color: '#B42318', marginTop: 30 }}>
          {erroGupy}
        </Text>
      ) : (
        <>
          {/* Vagas da Gupy não existem no nosso backend, então favoritar fica desativado aqui */}
          {vagasGupy.map(vaga => (
            <JobCard
              key={`gupy-${vaga.id}`}
              vaga={vaga}
              favorita={false}
              onPress={() => abrirDetalhes(vaga)}
              onFavorite={canManageFavorites ? () => alternarFavorito(vaga) : undefined} 
            />
          ))}

          {vagasGupy.length === 0 && (
            <Text style={{ textAlign: 'center', color: '#8792A6', marginTop: 30 }}>
              Nenhuma vaga da Gupy com esses critérios.
            </Text>
          )}

          {renderPaginacao(paginationGupy, paginaGupy, onPageChangeGupy)}
        </>
      )}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F6FC' }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
          }}
        >
          <View>
            <Text style={{ color: '#8792A6', fontSize: 14 }}>
              {session?.role === 'admin' ? 'Administrador' : 'Usuário'}
            </Text>
            <Text style={{ color: '#1D3C75', fontSize: 18 }}>
              Olá, {session?.username || 'Usuário'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {setEditingProfile ? (
              <TouchableOpacity
                onPress={() => setEditingProfile(true)}
                style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#EAF1FF', marginRight: 8 }}
              >
                <Text style={{ color: '#082347', fontSize: 11, fontWeight: '700' }}>Perfil</Text>
              </TouchableOpacity>
            ) : null}

            {onLogout ? (
              <TouchableOpacity onPress={onLogout} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#E8ECF5' }}>
                <Text style={{ color: '#082347', fontSize: 11, fontWeight: '700' }}>Sair</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {editingProfile ? (
          <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#DBE3F1' }}>
            <Text style={{ color: '#1D3C75', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>Editar perfil</Text>
            <TextInput
              value={profileDraft}
              onChangeText={setProfileDraft}
              placeholder="Novo nome de usuário"
              style={[
                { backgroundColor: '#F4F7FF', borderRadius: 10, paddingHorizontal: 12, height: 42, color: '#122B4E', marginBottom: 8 },
                session?.role === 'admin' && { opacity: 0.5, color: '#8A94A6', pointerEvents: 'none' }
              ]}
            />
            <TextInput
              value={profileCurrentPassword}
              onChangeText={setProfileCurrentPassword}
              placeholder="Senha atual"
              secureTextEntry
              style={[
                {
                  backgroundColor: '#F4F7FF',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 42,
                  color: '#122B4E',
                  marginBottom: 8,
                },
                session?.role === 'admin' && { opacity: 0.5, color: '#8A94A6', pointerEvents: 'none' },
              ]}
            />
            <TextInput
              value={profileNewPassword}
              onChangeText={setProfileNewPassword}
              placeholder="Nova senha"
              secureTextEntry
              style={[
                {
                  backgroundColor: '#F4F7FF',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 42,
                  color: '#122B4E',
                  marginBottom: 8,
                },
                session?.role === 'admin' && { opacity: 0.5, color: '#8A94A6', pointerEvents: 'none' },
              ]}
            />

            {profileError ? (
              <Text style={{ color: '#B42318', fontSize: 11, marginTop: 8 }}>{profileError}</Text>
            ) : null}
            {profileSuccess ? (
              <Text style={{ color: '#067647', fontSize: 11, marginTop: 8 }}>{profileSuccess}</Text>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setEditingProfile?.(false);
                  setProfileError?.('');
                  setProfileSuccess?.('');
                }}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#EEF2F9', marginRight: 8 }}
              >
                <Text style={{ color: '#203862', fontWeight: '700', fontSize: 11 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSaveProfile}
                style={[
                  { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: BLUE },
                  session?.role === 'admin' && { opacity: 0.5, pointerEvents: 'none' },
                ]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={{ color: '#1D3C75', fontSize: 18, marginTop: 6 }}>
          Encontre sua vaga
        </Text>

        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <TextInput
            value={busca}
            onChangeText={setBusca}
            onSubmitEditing={buscar}
            placeholder="Cargo, habilidade ou empresa"
            returnKeyType="search"
            style={{
              flex: 1,
              height: 42,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 11,
              fontSize: 11,
              marginRight: 6,
            }}
          />

          <TouchableOpacity
            onPress={abrirFiltros}
            style={{
              width: 42,
              backgroundColor: BLUE,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="options-outline" size={21} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {session?.role === 'admin' && onOpenAdmin ? (
          <TouchableOpacity
            onPress={onOpenAdmin}
            style={{
              backgroundColor: '#EAF1FF',
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              marginTop: 12,
              borderWidth: 1,
              borderColor: '#CFE0FF',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="briefcase-outline" size={18} color={BLUE} />
              <Text style={{ color: '#0D2347', fontWeight: '700', marginLeft: 8 }}>
                Cadastrar vagas
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={BLUE} />
          </TouchableOpacity>
        ) : null}

        {/* ===== Abas: Vagas da plataforma | Vagas da Gupy ===== */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeScreen === 'plataforma' && styles.activeTabButton]}
            onPress={() => setActiveScreen('plataforma')}
          >
            <Text style={[styles.tabButtonText, activeScreen === 'plataforma' && styles.activeTabButtonText]}>
              Vagas da plataforma
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeScreen === 'gupy' && styles.activeTabButton]}
            onPress={() => setActiveScreen('gupy')}
          >
            <Text style={[styles.tabButtonText, activeScreen === 'gupy' && styles.activeTabButtonText]}>
              Vagas da Gupy
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 14 }}>
          {activeScreen === 'plataforma' ? renderPlataforma() : renderGupy()}
        </View>
      </ScrollView>

      <BottomTabs
        active="Home"
        onSearch={() => { }}
        onFavorites={abrirFavoritos}
        onAdmin={onOpenAdmin}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DCE5F2',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#1647C5',
  },
  tabButtonText: {
    color: '#0D2347',
    fontWeight: '700',
    fontSize: 12,
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
});