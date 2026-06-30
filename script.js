// Mantenha aqui a sua URL do Apps Script gerada no seu painel
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5wtsSda51rruXfp6k2vgu3Oj7FuP_uNJqnJypJ_ft8FC9OToInhlO7PmGF4XZbOij/exec";

// Variáveis globais do sistema
let usuarioLogado = "";
let dadosProdutosFiltrados = []; 
let carrinho = [];      
let indicesImagens = {}; 

// ==========================================
// EXECUTA ASSIM QUE A PÁGINA CARREGA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Força o estado correto de inicialização visual na marra
    configurarEstadoInicialVisual();

    // Ouvinte para o botão de Entrar na tela de login
    const btnLoginSubmit = document.getElementById("btn-login");
    if (btnLoginSubmit) {
        btnLoginSubmit.addEventListener("click", fazerLogin);
    }

    // Ouvintes de clique para abrir/fechar a Sidebar no PC
    const btnCarrinhoTopo = document.getElementById("btn-carrinho-topo");
    if (btnCarrinhoTopo) {
        btnCarrinhoTopo.addEventListener("click", () => {
            if (window.innerWidth > 768) {
                alternarSidebarCarrinho(true);
            } else {
                alternarAbaSistemas('carrinho');
            }
        });
    }

    const btnFecharCarrinho = document.getElementById("btn-fechar-carrinho");
    if (btnFecharCarrinho) {
        btnFecharCarrinho.addEventListener("click", () => alternarSidebarCarrinho(false));
    }

    const overlayCarrinho = document.getElementById("overlay-carrinho");
    if (overlayCarrinho) {
        overlayCarrinho.addEventListener("click", () => alternarSidebarCarrinho(false));
    }

    // Ouvintes de clique para a navegação inferior (Mobile)
    const btnNavProdutos = document.getElementById("btn-nav-produtos");
    if (btnNavProdutos) {
        btnNavProdutos.addEventListener("click", () => alternarAbaSistemas('produtos'));
    }

    const btnNavCarrinho = document.getElementById("btn-nav-carrinho");
    if (btnNavCarrinho) {
        btnNavCarrinho.addEventListener("click", () => alternarAbaSistemas('carrinho'));
    }

    // Gatilho para monitorar mudanças no seletor de Categoria
    const filtroCategoria = document.getElementById("filtro-categoria");
    if (filtroCategoria) {
        filtroCategoria.addEventListener("change", filtrarPorCategoria);
    }

    // Gatilho para o Checkbox Promocional
    const filtroPromo = document.getElementById("filtro-promocional");
    if (filtroPromo) {
        filtroPromo.addEventListener("change", aplicarFiltroVisual);
    }

    // Gatilho para o botão de confirmação de Baixa
    const btnConfirmar = document.getElementById("btn-confirmar");
    if (btnConfirmar) {
        btnConfirmar.addEventListener("click",骗confirmarBaixa);
    }

    // Gatilho para o botão Sair
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", fazerLogout);
    }

    // Ouvinte preventivo para redimensionamento de janela dinâmico
    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            const abaProdutos = document.getElementById("aba-produtos");
            const abaCarrinho = document.getElementById("aba-carrinho");
            if (abaProdutos) abaProdutos.classList.remove("exibir-mobile");
            if (abaCarrinho) abaCarrinho.classList.remove("exibir-mobile");
            
            const navMobile = document.getElementById("nav-mobile-sistema");
            if (navMobile) navMobile.classList.add("escondido");
        } else {
            alternarSidebarCarrinho(false);
            if (usuarioLogado) {
                const navMobile = document.getElementById("nav-mobile-sistema");
                if (navMobile) navMobile.classList.remove("escondido");
            }
        }
    });
});

// Função para garantir que apenas a tela de login apareça no recarregamento (F5)
function configurarEstadoInicialVisual() {
    alternarSidebarCarrinho(false);
    
    const telaLogin = document.getElementById("tela-login");
    const painelPrincipal = document.getElementById("painel-principal");
    const navMobile = document.getElementById("nav-mobile-sistema");

    // Injeta estilização limpa e moderna para o painel de Login sem quebrar o HTML
    if (!document.getElementById("estilo-login-custom")) {
        const estilo = document.createElement("style");
        estilo.id = "estilo-login-custom";
        estilo.innerHTML = `
            #tela-login {
                display: flex !important;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 20px;
                box-sizing: border-box;
            }
            #tela-login .container, #tela-login .login-box, .box-login, #tela-login > div:not(.escondido) {
                background: #ffffff;
                padding: 40px 30px;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(160, 175, 195, 0.15);
                width: 100%;
                max-width: 380px;
                text-align: center;
                box-sizing: border-box;
            }
            #tela-login h2, #tela-login h1 {
                color: #2d3748;
                font-size: 24px;
                margin-top: 0;
                margin-bottom: 24px;
                font-weight: 600;
                letter-spacing: -0.5px;
            }
            #tela-login .form-grupo, #tela-login div {
                margin-bottom: 16px;
                text-align: left;
            }
            #tela-login label {
                display: block;
                color: #4a5568;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 6px;
            }
            #tela-login input[type="text"], #tela-login input[type="password"] {
                width: 100%;
                padding: 12px 14px;
                border: 1.5px solid #e2e8f0;
                border-radius: 8px;
                font-size: 15px;
                color: #2d3748;
                background-color: #f8fafc;
                box-sizing: border-box;
                transition: all 0.2s ease;
            }
            #tela-login input:focus {
                outline: none;
                border-color: #4f46e5;
                background-color: #ffffff;
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
            }
            #tela-login button {
                width: 100%;
                padding: 14px;
                background: linear-gradient(90deg, #4f46e5 0%, #4338ca 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
                transition: all 0.2s ease;
                margin-top: 8px;
            }
            #tela-login button:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 15px rgba(79, 70, 229, 0.25);
            }
            #tela-login button:disabled {
                background: #a5b4fc;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            #erro-login {
                color: #e53e3e;
                font-size: 13px;
                margin-top: 12px;
                text-align: center;
                font-weight: 500;
                min-height: 18px;
            }
        `;
        document.head.appendChild(estilo);
    }

    if (telaLogin) {
        telaLogin.classList.remove("escondido");
        telaLogin.style.display = ""; // Força renderização do CSS padrão
    }
    if (painelPrincipal) {
        painelPrincipal.classList.add("escondido");
    }
    if (navMobile) {
        navMobile.classList.add("escondido");
    }
    
    // Reseta textos internos de carregamento residual
    const nomeOperador = document.getElementById("nome-operador");
    if (nomeOperador) nomeOperador.innerText = "Usuário: ";
}

// ==========================================
// CONTROLADOR DE NAVEGAÇÃO E SIDEBAR (GAVETA)
// ==========================================
function alternarAbaSistemas(abaDestino) {
    const abaProdutos = document.getElementById("aba-produtos");
    const abaCarrinho = document.getElementById("aba-carrinho");
    const btnMbProdutos = document.getElementById("btn-nav-produtos");
    const btnMbCarrinho = document.getElementById("btn-nav-carrinho");

    if (window.innerWidth <= 768) {
        alternarSidebarCarrinho(false);

        if (abaDestino === 'produtos') {
            if (abaProdutos) abaProdutos.classList.add("exibir-mobile");
            if (abaCarrinho) abaCarrinho.classList.remove("exibir-mobile");
            
            if (btnMbProdutos) btnMbProdutos.classList.add("ativa");
            if (btnMbCarrinho) btnMbCarrinho.classList.remove("ativa");
        } else if (abaDestino === 'carrinho') {
            if (abaCarrinho) abaCarrinho.classList.add("exibir-mobile");
            if (abaProdutos) abaProdutos.classList.remove("exibir-mobile");
            
            if (btnMbCarrinho) btnMbCarrinho.classList.add("ativa");
            if (btnMbProdutos) btnMbProdutos.classList.remove("ativa");
        }
    } 
}

function alternarSidebarCarrinho(abrir) {
    const sidebar = document.getElementById("aba-carrinho");
    const overlay = document.getElementById("overlay-carrinho");

    if (abrir === undefined && sidebar) {
        abrir = !sidebar.classList.contains("aberta");
    }

    if (window.innerWidth > 768) {
        if (abrir) {
            if (sidebar) sidebar.classList.add("aberta");
            if (overlay) overlay.classList.add("visivel");
        } else {
            if (sidebar) sidebar.classList.remove("aberta");
            if (overlay) overlay.classList.remove("visivel");
        }
    } else {
        if (sidebar) sidebar.classList.remove("aberta");
        if (overlay) overlay.classList.remove("visivel");
    }
}

// Função de Saída Segura Total (Logout)
function fazerLogout() {
    usuarioLogado = "";
    carrinho = [];
    dadosProdutosFiltrados = [];
    indicesImagens = {};
    
    // Limpa inputs
    const usuarioField = document.getElementById("usuario");
    const senhaField = document.getElementById("senha");
    if (usuarioField) usuarioField.value = "";
    if (senhaField) senhaField.value = "";
    
    const filtroCat = document.getElementById("filtro-categoria");
    if (filtroCat) filtroCat.innerHTML = '<option value="">-- Escolha uma Categoria --</option>';
    
    const gridProd = document.getElementById("grid-produtos");
    if (gridProd) gridProd.innerHTML = '<p class="carrinho-vazio">Selecione uma categoria acima para listar os modelos correspondentes.</p>';
    
    // Força alteração drástica de exibição para evitar a tela cinza
    const painelPrincipal = document.getElementById("painel-principal");
    if (painelPrincipal) painelPrincipal.classList.add("escondido");
    
    const navMobile = document.getElementById("nav-mobile-sistema");
    if (navMobile) navMobile.classList.add("escondido");
    
    const telaLogin = document.getElementById("tela-login");
    if (telaLogin) {
        telaLogin.classList.remove("escondido");
    }
    
    const btnLogin = document.getElementById("btn-login");
    if (btnLogin) {
        btnLogin.innerText = "Entrar";
        btnLogin.disabled = false;
    }
    
    const erroLogin = document.getElementById("erro-login");
    if (erroLogin) erroLogin.innerText = "";
    
    alternarSidebarCarrinho(false);
    atualizarInterfaceCarrinho();
}

// ==========================================
// INTERFACE DE LOGIN E CARREGAMENTO INICIAL
// ==========================================
async function fazerLogin() {
    const usuarioInput = document.getElementById("usuario").value.trim();
    const senhaInput = document.getElementById("senha").value.trim();
    const erroLogin = document.getElementById("erro-login");
    const btnLogin = document.getElementById("btn-login");

    if (!usuarioInput || !senhaInput) {
        if (erroLogin) erroLogin.innerText = "Preencha todos os campos.";
        return;
    }

    btnLogin.innerText = "Verificando...";
    btnLogin.disabled = true;
    if (erroLogin) erroLogin.innerText = "";

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({
            acao: "login",
            usuario: usuarioInput,
            senha: senhaInput
        }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            usuarioLogado = usuarioInput;
            const nomeOperador = document.getElementById("nome-operador");
            if (nomeOperador) nomeOperador.innerText = `Usuário: ${usuarioLogado}`;
            
            const telaLogin = document.getElementById("tela-login");
            if (telaLogin) telaLogin.classList.add("escondido");

            const painelPrincipal = document.getElementById("painel-principal");
            if (painelPrincipal) painelPrincipal.classList.remove("escondido");
            
            // Controle apurado de visibilidade do menu inferior mobile
            const navMobile = document.getElementById("nav-mobile-sistema");
            if (navMobile) {
                if (window.innerWidth <= 768) {
                    navMobile.classList.remove("escondido");
                } else {
                    navMobile.classList.add("escondido");
                }
            }
            
            if (window.innerWidth > 768) {
                const abaProdutos = document.getElementById("aba-produtos");
                const abaCarrinho = document.getElementById("aba-carrinho");
                if (abaProdutos) abaProdutos.classList.remove("exibir-mobile");
                if (abaCarrinho) abaCarrinho.classList.remove("exibir-mobile");
                alternarSidebarCarrinho(false);
            } else {
                alternarAbaSistemas('produtos');
            }
            
            carregarCategoriasDinamicas();
        } else {
            if (erroLogin) erroLogin.innerText = resultado.erro || "Usuário ou senha incorretos.";
            btnLogin.innerText = "Entrar";
            btnLogin.disabled = false;
        }
    } catch (erro) {
        console.error("Erro no login:", erro);
        if (erroLogin) erroLogin.innerText = "Erro ao conectar com o servidor.";
        btnLogin.innerText = "Entrar";
        btnLogin.disabled = false;
    }
}

// ==========================================
// CONFIGURAÇÃO DO SELETOR DINÂMICO
// ==========================================
async function carregarCategoriasDinamicas() {
    const seletor = document.getElementById("filtro-categoria");
    if (!seletor) return;

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({ acao: "obterAbas" }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            seletor.innerHTML = '<option value="">-- Escolha uma Categoria --</option>';
            resultado.abas.forEach(aba => {
                const opcao = document.createElement("option");
                opcao.value = aba;
                opcao.innerText = aba;
                seletor.appendChild(opcao);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar categorias dinâmicas:", erro);
    }
}

// ==========================================
// FILTRAGEM E EXIBIÇÃO DE PRODUTOS (REVISADO)
// ==========================================
async function filtrarPorCategoria() {
    const categoriaSelecionada = document.getElementById("filtro-categoria").value;
    const containerFiltrados = document.getElementById("grid-produtos");

    if (!categoriaSelecionada) {
        if (containerFiltrados) containerFiltrados.innerHTML = '<p class="carrinho-vazio">Selecione uma categoria acima para listar os modelos correspondentes.</p>';
        return;
    }

    if (containerFiltrados) containerFiltrados.innerHTML = '<p class="carrinho-vazio">Filtrando categoria no servidor...</p>';

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({
            acao: "obterProdutos",
            tipo: categoriaSelecionada
        }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            // CORREÇÃO: Garante o mapeamento do nome da aba ativa direto no corpo de cada produto
            dadosProdutosFiltrados = resultado.produtos.map(p => {
                return { ...p, categoria: p.categoria || categoriaSelecionada };
            });
            aplicarFiltroVisual();
        } else {
            if (containerFiltrados) containerFiltrados.innerHTML = `<p class="carrinho-vazio" style="color: var(--cor-erro);">Erro ao buscar categoria: ${resultado.erro}</p>`;
        }
    } catch (erro) {
        console.error("Erro no filtro:", erro);
        if (containerFiltrados) containerFiltrados.innerHTML = '<p class="carrinho-vazio" style="color: var(--cor-erro);">Erro de rede ao buscar categoria.</p>';
    }
}

function aplicarFiltroVisual() {
    const filtroPromoCheckbox = document.getElementById("filtro-promocional");
    const apenasPromocionais = filtroPromoCheckbox ? filtroPromoCheckbox.checked : false;
    
    if (apenasPromocionais) {
        const produtosPromocionais = dadosProdutosFiltrados.filter(produto => {
            if (!produto.estoquePromocional) return false;
            return Object.values(produto.estoquePromocional).some(qtd => qtd > 0);
        });
        renderizarProdutos(produtosPromocionais, "grid-produtos", "produtos", true);
    } else {
        renderizarProdutos(dadosProdutosFiltrados, "grid-produtos", "produtos", false);
    }
}

function renderizarProdutos(listaProdutos, containerId, prefixoContexto, usarEstoquePromo = false) {
    const listaDiv = document.getElementById(containerId);
    if (!listaDiv) return;
    listaDiv.innerHTML = "";

    if (listaProdutos.length === 0) {
        listaDiv.innerHTML = "<p class='carrinho-vazio'>Nenhum modelo cadastrado ou disponível para os filtros selecionados.</p>";
        return;
    }

    listaProdutos.forEach(produto => {
        const idUnicoControle = `${prefixoContexto}-${produto.id}`;
        
        if (indicesImagens[idUnicoControle] === undefined) {
            indicesImagens[idUnicoControle] = 0;
        }

        const mapaEstoqueAlvo = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
        if (!mapaEstoqueAlvo) return;

        const coresTotais = Object.keys(mapaEstoqueAlvo);
        const coresDisponiveis = usarEstoquePromo ? coresTotais.filter(cor => (mapaEstoqueAlvo[cor] || 0) > 0) : coresTotais;
        
        if (coresDisponiveis.length === 0) return;

        const primeiraCor = coresDisponiveis[0] || "Padrão";
        const estoqueInicial = mapaEstoqueAlvo[primeiraCor] || 0;

        const mapaImagensAlvo = (usarEstoquePromo && produto.imagemPromoPorCor) ? produto.imagemPromoPorCor : produto.imagemPorCor;
        const urlImagemInicial = mapaImagensAlvo ? mapaImagensAlvo[primeiraCor] : "";

        let indiceInicialEncontrado = 0;
        if (urlImagemInicial && produto.imagens) {
            const idx = produto.imagens.findIndex(url => url === urlImagemInicial || urlImagemInicial.includes(url) || url.includes(urlImagemInicial));
            if (idx !== -1) {
                indiceInicialEncontrado = idx;
                indicesImagens[idUnicoControle] = idx;
            }
        }

        let imagensHTML = "";
        if (produto.imagens && produto.imagens.length > 0) {
            produto.imagens.forEach((url, index) => {
                const classeAtiva = (index === indiceInicialEncontrado) ? 'ativa' : '';
                imagensHTML += `<img src="${url}" class="${classeAtiva}" data-index="${index}" alt="${produto.nome}">`;
            });
        } else {
            imagensHTML += `<img src="https://placehold.co/400x400?text=Sem+Foto" class="ativa" alt="Sem Foto">`;
        }

        let botoesCarrossel = "";
        if (produto.imagens && produto.imagens.length > 1) {
            botoesCarrossel = `
                <button class="btn-carrossel btn-prev" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, -1)">&#10094;</button>
                <button class="btn-carrossel btn-next" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, 1)">&#10095;</button>
            `;
        }

        let coresOpcoes = "";
        coresDisponiveis.forEach(cor => {
            coresOpcoes += `<option value="${cor}">${cor}</option>`;
        });

        const tagPromoHTML = usarEstoquePromo ? `<div style="position: absolute; top: 10px; left: 10px; background-color: var(--cor-erro); color: white; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; z-index: 3; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">Promoção</div>` : '';

        // ALTERAÇÃO: Remove o caractere '#' do nome na hora de renderizar os cartões na tela
        const nomeFormatado = produto.nome.replace("#", "").trim();

        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";
        cartao.innerHTML = `
            <div class="carrossel" id="carrossel-${idUnicoControle}">
                ${tagPromoHTML}
                ${imagensHTML}
                ${botoesCarrossel}
            </div>
            <div class="info-produto">
                <h3>${nomeFormatado}</h3>
                <div class="seletor-grupo">
                    <label>Selecione a Cor / Tamanho:</label>
                    <select id="cor-${idUnicoControle}" onchange="atualizarStatusEstoque('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">
                        ${coresOpcoes}
                    </select>
                </div>
                <p class="estoque-status ${estoqueInicial === 0 ? 'sem-estoque' : ''}" id="status-${idUnicoControle}">
                    ${usarEstoquePromo ? 'Estoque Promo: ' : 'Estoque disponível: '}<span>${estoqueInicial}</span> un.
                </p>
            </div>
            <button class="btn-adicionar" id="btn-add-${idUnicoControle}" onclick="adicionarAoCarrinho('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">
                Selecionar Peça
            </button>
        `;
        listaDiv.appendChild(cartao);
    });
}

function atualizarStatusEstoque(produtoId, prefixoContexto, usarEstoquePromo = false) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => String(p.id) === String(produtoId));
    if (!produto) return;
    
    const seletorCor = document.getElementById(`cor-${idUnicoControle}`);
    if (!seletorCor) return;
    const corSelecionada = seletorCor.value;
    
    const mapaEstoque = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
    const qtdDisponivel = mapaEstoque[corSelecionada] || 0;

    const statusP = document.getElementById(`status-${idUnicoControle}`);
    const btnAdd = document.getElementById(`btn-add-${idUnicoControle}`);

    if (statusP) {
        const spanEstoque = statusP.querySelector("span");
        if (spanEstoque) spanEstoque.innerText = qtdDisponivel;
        if (qtdDisponivel === 0) {
            statusP.classList.add("sem-estoque");
        } else {
            statusP.classList.remove("sem-estoque");
        }
    }
    
    if (btnAdd) {
        if (qtdDisponivel === 0) {
            btnAdd.innerText = "Esgotado";
            btnAdd.disabled = true;
        } else {
            btnAdd.innerText = "Selecionar Peça";
            btnAdd.disabled = false;
        }
    }

    const mapaImagensAlvo = (usarEstoquePromo && produto.imagemPromoPorCor) ? produto.imagemPromoPorCor : produto.imagemPorCor;
    const urlImagemCor = mapaImagensAlvo ? mapaImagensAlvo[corSelecionada] : "";
    
    if (urlImagemCor) {
        const carrosselDiv = document.getElementById(`carrossel-${idUnicoControle}`);
        if (carrosselDiv) {
            const images = carrosselDiv.querySelectorAll("img");
            images.forEach((img, index) => {
                const srcAtual = img.getAttribute('src');
                if (srcAtual === urlImagemCor || urlImagemCor.includes(srcAtual) || srcAtual.includes(urlImagemCor)) {
                    images.forEach(i => i.classList.remove("ativa"));
                    img.classList.add("ativa");
                    indicesImagens[idUnicoControle] = index;
                }
            });
        }
    }
}

function mudarFoto(idUnicoControle, totalFotos, direcao) {
    indicesImagens[idUnicoControle] = (indicesImagens[idUnicoControle] + direcao + totalFotos) % totalFotos;
    const carrosselDiv = document.getElementById(`carrossel-${idUnicoControle}`);
    if (carrosselDiv) {
        const images = carrosselDiv.querySelectorAll("img");
        images.forEach(img => img.classList.remove("ativa"));
        if (images[indicesImagens[idUnicoControle]]) {
            images[indicesImagens[idUnicoControle]].classList.add("ativa");
        }
    }
}

// ==========================================
// REGRAS DO CARRINHO DE TRANSMISSÃO
// ==========================================
function adicionarAoCarrinho(produtoId, prefixoContexto, usarEstoquePromo = false) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => String(p.id) === String(produtoId));
    if (!produto) return;
    
    const seletorCor = document.getElementById(`cor-${idUnicoControle}`);
    if (!seletorCor) return;
    const corSelecionada = seletorCor.value;

    const mapaEstoque = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
    const estoqueMaximo = mapaEstoque[corSelecionada] || 0;

    const itemExistente = carrinho.find(item => String(item.id) === String(produtoId) && item.corSelecionada === corSelecionada && item.promocional === usarEstoquePromo);

    // ALTERAÇÃO: Remove o caractere '#' do nome para salvar de forma limpa no carrinho também
    const nomeLimpo = produto.nome.replace("#", "").trim();

    if (itemExistente) {
        if (itemExistente.quantidade < estoqueMaximo) {
            itemExistente.quantidade++;
        } else {
            alert(`Fim do estoque físico para esta variação.`);
            return;
        }
    } else {
        const categoriaAtiva = produto.categoria || document.getElementById("filtro-categoria").value;

        carrinho.push({
            id: produtoId,
            nome: nomeLimpo + (usarEstoquePromo ? " (PROMO)" : ""),
            corSelecionada: corSelecionada,
            quantidade: 1,
            maximo: estoqueMaximo,
            promocional: usarEstoquePromo,
            categoriaOrigem: categoriaAtiva
        });
    }
    atualizarInterfaceCarrinho();
}

function silverwareDelete(index) {
    carrinho.splice(index, 1);
    atualizarInterfaceCarrinho();
}

function alterarQuantidadeCarrinho(index, alteracao) {
    const item = carrinho[index];
    if (!item) return;
    const novaQtd = item.quantidade + alteracao;

    if (novaQtd <= 0) {
        carrinho.splice(index, 1);
    } else if (novaQtd <= item.maximo) {
        item.quantidade = novaQtd;
    } else {
        alert("A quantidade excede o estoque real disponível.");
    }
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const containerMobile = document.getElementById("itens-carrinho");
    const btnConfirmarMobile = document.getElementById("btn-confirmar");

    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    
    const elementoBadgeMb = document.getElementById("contador-Abas");      
    const elementoBadgePc = document.getElementById("contador-topo");  

    if (elementoBadgeMb) elementoBadgeMb.innerText = totalItens;
    if (elementoBadgePc) elementoBadgePc.innerText = totalItens;

    const htmlVazio = '<p class="carrinho-vazio">Nenhum item selecionado.</p>';

    if (carrinho.length === 0) {
        if (containerMobile) containerMobile.innerHTML = htmlVazio;
        if (btnConfirmarMobile) btnConfirmarMobile.disabled = true;
        return;
    }

    if (containerMobile) {
        containerMobile.innerHTML = "";
        carrinho.forEach((item, index) => {
            const linha = document.createElement("div");
            linha.className = "item-carrinho-linha";
            linha.innerHTML = `
                <div>
                    <strong>${item.nome}</strong><br>
                    <small>${item.categoriaOrigem} (${item.corSelecionada})</small>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <button onclick="alterarQuantidadeCarrinho(${index}, -1)">-</button>
                    <span style="font-weight: bold; min-width:20px; text-align:center;">${item.quantidade}</span>
                    <button onclick="alterarQuantidadeCarrinho(${index}, 1)">+</button>
                </div>
                <button style="background-color: #ff4d4d; color: white;" onclick="silverwareDelete(${index})">Excluir</button>
            `;
            containerMobile.appendChild(linha);
        });
    }

    if (btnConfirmarMobile) btnConfirmarMobile.disabled = false;
}

async function confirmarBaixa() {
    const elementoDestino = document.getElementById("select-destino");
    if (!elementoDestino) return;
    
    const localizacao = elementoDestino.value;
    const btnConfirmar = document.getElementById("btn-confirmar");

    if (carrinho.length === 0) return;
    if (!confirm(`Confirmar a retirada destes itens para: ${localizacao}?`)) return;

    if (btnConfirmar) {
        btnConfirmar.innerText = "Processando...";
        btnConfirmar.disabled = true;
    }

    try {
        for (let item of carrinho) {
            const params = new URLSearchParams();
            params.append("dados", JSON.stringify({
                acao: "darBaixa",
                tipo: item.categoriaOrigem,
                usuario: usuarioLogado,
                localizacao: localizacao,
                isPromo: item.promocional, 
                carrinho: [item]
            }));

            const resposta = await fetch(WEB_APP_URL, {
                method: "POST",
                body: params,
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });
            await resposta.json();
        }

        alert("Baixa processada com sucesso!");
        carrinho = [];
        alternarSidebarCarrinho(false);
        atualizarInterfaceCarrinho();
        
        filtrarPorCategoria();

    } catch (erro) {
        console.error("Erro na baixa:", erro);
        alert("Erro crítico ao sincronizar os dados de saída.");
    } finally {
        if (btnConfirmar) {
            btnConfirmar.innerText = "Confirmar";
            btnConfirmar.disabled = false;
        }
    }
}
