// ========== src/pages/Privacy.tsx ==========
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Privacy.css';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="privacy-page">
      <div className="privacy-container">
        {/* HEADER */}
        <div className="privacy-header">
          <button className="privacy-back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left" />
          </button>
          <h1 className="privacy-title">
            <i className="fas fa-shield-alt" />
            Politique de confidentialité
          </h1>
        </div>

        {/* CONTENU */}
        <div className="privacy-content">
          <div className="privacy-section">
            <h2>1. Collecte des données</h2>
            <p>
              Nous collectons les informations que vous nous fournissez 
              directement, notamment :
            </p>
            <ul>
              <li>Nom, prénom et date de naissance</li>
              <li>Adresse email et mot de passe crypté</li>
              <li>Contenu publié (posts, commentaires, photos)</li>
              <li>Préférences et paramètres de l'application</li>
              <li>Données de connexion et d'utilisation</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>2. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul>
              <li>Fournir et améliorer nos services</li>
              <li>Personnaliser votre expérience</li>
              <li>Assurer la sécurité de votre compte</li>
              <li>Vous contacter concernant votre compte</li>
              <li>Analyser l'utilisation de la plateforme</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>3. Protection des données</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité pour protéger 
              vos données personnelles :
            </p>
            <ul>
              <li>Cryptage des mots de passe</li>
              <li>Connexions sécurisées (HTTPS)</li>
              <li>Accès limité aux données</li>
              <li>Surveillance et audits réguliers</li>
              <li>Sauvegardes chiffrées</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>4. Partage des données</h2>
            <p>
              Nous ne vendons pas vos données personnelles. Nous pouvons 
              partager vos données dans les cas suivants :
            </p>
            <ul>
              <li>Avec votre consentement explicite</li>
              <li>Pour répondre à une obligation légale</li>
              <li>Avec nos prestataires de services (hébergement, etc.)</li>
              <li>Pour protéger les droits de K-POP UNITED</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>5. Cookies et technologies</h2>
            <p>
              Nous utilisons des cookies pour améliorer votre expérience :
            </p>
            <ul>
              <li>Cookies essentiels pour le fonctionnement</li>
              <li>Cookies de préférences utilisateur</li>
              <li>Cookies d'analyse de performance</li>
              <li>Cookies de session sécurisée</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>6. Droits des utilisateurs</h2>
            <p>Vous avez le droit de :</p>
            <ul>
              <li>Accéder à vos données personnelles</li>
              <li>Modifier ou corriger vos données</li>
              <li>Supprimer votre compte et vos données</li>
              <li>Retirer votre consentement à tout moment</li>
              <li>Demander l'exportation de vos données</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>7. Conservation des données</h2>
            <p>
              Nous conservons vos données aussi longtemps que votre compte 
              est actif, ou selon les besoins légaux et réglementaires. 
              Vous pouvez demander la suppression de vos données à tout moment.
            </p>
          </div>

          <div className="privacy-section">
            <h2>8. Utilisateurs mineurs</h2>
            <p>
              Notre plateforme est destinée aux utilisateurs âgés d'au moins 
              13 ans. Nous ne collectons pas sciemment de données provenant 
              d'enfants de moins de 13 ans. Si vous êtes parent ou tuteur, 
              veuillez nous contacter si vous pensez que nous avons collecté 
              des données d'un mineur.
            </p>
          </div>

          <div className="privacy-section">
            <h2>9. Contact</h2>
            <p>
              Pour toute question concernant notre politique de confidentialité, 
              veuillez nous contacter à :{' '}
              <a href="mailto:privacy@kpop-united.com">privacy@kpop-united.com</a>
            </p>
          </div>

          <div className="privacy-footer">
            <p>Dernière mise à jour : 25 juillet 2026</p>
            <p>© 2026 K-POP UNITED. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;